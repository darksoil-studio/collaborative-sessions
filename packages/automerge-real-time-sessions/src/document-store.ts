import { next as Automerge, Change, SyncMessage } from '@automerge/automerge';
import { Signal } from '@darksoil-studio/holochain-signals';
import {
	PeerJoinedPayload,
	PeerMessagePayload,
	RealTimeSessionsClient,
	SessionStore,
	effect,
} from '@darksoil-studio/real-time-sessions-zome';
import {
	AgentPubKey,
	AgentPubKeyB64,
	decodeHashFromBase64,
	encodeHashToBase64,
} from '@holochain/client';

import { DocHandle, DocHandleChangePayload } from './doc-handle.js';

export type DocumentStoreEvents<T> = {
	change: (payload: DocHandleChangePayload<T>) => void;
};

export type DocumentSessionMessages =
	| {
			type: 'sync';
			syncMessage: SyncMessage;
	  }
	| {
			type: 'change';
			change: Change;
	  };

export class DocumentStore<T>
	extends SessionStore<DocumentSessionMessages, DocumentStoreEvents<T>>
	implements DocHandle<T>
{
	/** Sync state for each peer we've communicated with (including inactive peers) */
	private syncStates: Record<AgentPubKeyB64, Automerge.SyncState> = {};

	constructor(
		public client: RealTimeSessionsClient,
		public sessionId: string,
		public acceptedPeers:
			| Signal.State<AgentPubKey[]>
			| Signal.Computed<AgentPubKey[]>,
		protected doc: Automerge.Doc<T>,
	) {
		super(client, sessionId, acceptedPeers);

		this.on(
			'peer-message',
			(peerMessage: PeerMessagePayload<DocumentSessionMessages>) => {
				switch (peerMessage.message.type) {
					case 'sync':
						this.handleSyncMessage(
							encodeHashToBase64(peerMessage.peer),
							peerMessage.message.syncMessage,
						);
						return;
					case 'change':
						this.handleChange(
							encodeHashToBase64(peerMessage.peer),
							peerMessage.message.change,
						);
						return;
				}
			},
		);
		this.on('peer-joined', (payload: PeerJoinedPayload) =>
			this.sendSyncMessage(encodeHashToBase64(payload.peer)),
		);
	}

	change(fn: (doc: T) => void) {
		this.doc = Automerge.change(
			this.doc,
			{
				patchCallback: (patches, info) => {
					this.emit('change', {
						doc: this.doc,
						handle: this,
						patches,
						patchInfo: info,
					} as DocHandleChangePayload<T>);
				},
			},
			fn,
		);

		const change = Automerge.getLastLocalChange(this.doc);

		if (change) {
			this.sendMessage(this.activePeers, {
				type: 'change',
				change,
			});
		}
	}

	docSync(): Automerge.Doc<T> {
		return this.doc;
	}

	private async syncWithPeers() {
		this.activePeers.forEach(peerId =>
			this.sendSyncMessage(encodeHashToBase64(peerId)),
		);
	}

	private sendSyncMessage(peerId: AgentPubKeyB64) {
		// this.#log(`sendSyncMessage ->${peerId}`);
		if (!this.syncStates[peerId]) {
			this.syncStates[peerId] = Automerge.initSyncState();
		}

		const syncState = this.syncStates[peerId];

		const [newSyncState, message] = Automerge.generateSyncMessage(
			this.doc,
			syncState,
		);
		if (message) {
			this.syncStates[peerId] = newSyncState;
			this.sendMessage([decodeHashFromBase64(peerId)], {
				type: 'sync',
				syncMessage: message,
			});
		}
	}

	private handleSyncMessage(peerId: AgentPubKeyB64, message: SyncMessage) {
		if (!this.syncStates[peerId]) {
			this.syncStates[peerId] = Automerge.initSyncState();
		}
		const syncState = this.syncStates[peerId];
		const [newDoc, newSyncState] = Automerge.receiveSyncMessage(
			this.doc,
			syncState,
			message,
			{
				patchCallback: (patches, info) => {
					this.emit('change', {
						doc: this.doc,
						handle: this,
						patches,
						patchInfo: info,
					} as DocHandleChangePayload<T>);
				},
			},
		);
		this.doc = newDoc;

		this.syncStates[peerId] = newSyncState;

		this.sendSyncMessage(peerId);
	}

	private handleChange(_peer: AgentPubKeyB64, change: Change) {
		const [newDoc] = Automerge.applyChanges(this.doc, [change], {
			patchCallback: (patches, info) => {
				this.emit('change', {
					doc: this.doc,
					handle: this,
					patches,
					patchInfo: info,
				} as DocHandleChangePayload<T>);
			},
		});

		this.doc = newDoc;
	}
}
