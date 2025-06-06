import {
	next as Automerge,
	Change,
	Patch,
	PatchInfo,
	SyncMessage,
} from '@automerge/automerge';
import {
	CollaborativeSession,
	CollaborativeSessionEvents,
	CollaborativeSessionsClient,
	CollaboratorJoinedPayload,
	MessageReceivedPayload,
} from '@darksoil-studio/collaborative-sessions-zome';
import { Signal } from '@darksoil-studio/holochain-signals';
import {
	AgentPubKey,
	AgentPubKeyB64,
	decodeHashFromBase64,
	encodeHashToBase64,
} from '@holochain/client';
import { EventEmitter } from 'eventemitter3';

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

export class CollaborativeDocument<T>
	extends EventEmitter<DocumentStoreEvents<T>>
	implements DocHandle<T>
{
	public session!: CollaborativeSession<DocumentSessionMessages>;
	/** Sync state for each peer we've communicated with (including inactive peers) */
	private syncStates: Record<AgentPubKeyB64, Automerge.SyncState> = {};

	constructor(
		public client: CollaborativeSessionsClient,
		public sessionId: string,
		public acceptedCollaborators:
			| Signal.State<AgentPubKey[]>
			| Signal.Computed<AgentPubKey[]>,
		protected doc: Automerge.Doc<T>,
	) {
		super();

		this.session = new CollaborativeSession(
			this.client,
			this.sessionId,
			this.acceptedCollaborators,
		);

		this.session.on(
			'message-received',
			(messageReceived: MessageReceivedPayload<DocumentSessionMessages>) => {
				switch (messageReceived.message.type) {
					case 'sync':
						this.handleSyncMessage(
							encodeHashToBase64(messageReceived.collaborator),
							messageReceived.message.syncMessage,
						);
						return;
					case 'change':
						this.handleChange(
							encodeHashToBase64(messageReceived.collaborator),
							messageReceived.message.change,
						);
						return;
				}
			},
		);
		this.session.on(
			'collaborator-joined',
			(payload: CollaboratorJoinedPayload) =>
				this.sendSyncMessage(encodeHashToBase64(payload.collaborator)),
		);
	}

	change(fn: (doc: T) => void) {
		this.doc = Automerge.change(
			this.doc,
			{
				patchCallback: this.patchCallback.bind(this),
			},
			fn,
		);

		const change = Automerge.getLastLocalChange(this.doc);

		if (change) {
			this.session.sendMessage(this.session.activeCollaborators, {
				type: 'change',
				change,
			});
		}
	}

	docSync(): Automerge.Doc<T> {
		return this.doc;
	}

	private async syncWithPeers() {
		this.session.activeCollaborators.forEach(peerId =>
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
			this.session.sendMessage([decodeHashFromBase64(peerId)], {
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
				patchCallback: this.patchCallback.bind(this),
			},
		);
		this.doc = newDoc;

		this.syncStates[peerId] = newSyncState;

		this.sendSyncMessage(peerId);
	}

	private handleChange(_peer: AgentPubKeyB64, change: Change) {
		const [newDoc] = Automerge.applyChanges(this.doc, [change], {
			patchCallback: this.patchCallback.bind(this),
		});

		this.doc = newDoc;
	}

	private patchCallback(patches: Patch[], info: PatchInfo<T>) {
		this.emit('change', {
			doc: info.after,
			handle: this,
			patches,
			patchInfo: info,
		} as DocHandleChangePayload<T>);
	}
}
