import { SyncMessage } from '@automerge/automerge';
import {
	Automerge,
	DocumentId,
	Message,
	PeerId,
	Repo,
} from '@automerge/automerge-repo/slim';
import { Signal } from '@darksoil-studio/holochain-signals';
import {
	PeerMessagePayload,
	RealTimeSessionsClient,
	SessionStore,
} from '@darksoil-studio/real-time-sessions-zome';
import {
	AgentPubKey,
	decodeHashFromBase64,
	encodeHashToBase64,
} from '@holochain/client';
import { encode } from '@msgpack/msgpack';

import { DocHandle, DocHandleChangePayload } from './doc-handle.js';

export type DocumentStoreEvents<T> = {
	change: () => void;
};

export type DocumentSessionMessages = {
	type: 'sync';
	message: SyncMessage;
};

export class DocumentStore<T>
	extends SessionStore<DocumentSessionMessages, DocumentStoreEvents<T>>
	implements DocHandle<T>
{
	/** Sync state for each peer we've communicated with (including inactive peers) */
	private syncStates: Record<PeerId, Automerge.SyncState> = {};

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
			(message: PeerMessagePayload<DocumentSessionMessages>) => {
				switch (message.message.type) {
					case 'sync':
						return;
				}
			},
		);
	}

	change(fn: (doc: T) => void) {
		return Automerge.change(this.doc, fn);
	}

	docSync(): Automerge.next.Doc<T> {
		return this.doc;
	}

	async syncWithPeers() {
		this.activePeers
			.get()
			.forEach(peerId =>
				this.sendSyncMessage(encodeHashToBase64(peerId) as PeerId),
			);
	}

	sendSyncMessage(peerId: PeerId) {
		// this.#log(`sendSyncMessage ->${peerId}`);

		const syncState = this.syncStates[peerId];

		const [newSyncState, message] = Automerge.generateSyncMessage(
			this.doc,
			syncState,
		);
		if (message) {
			this.syncStates[peerId] = newSyncState;
			const isNew = Automerge.getHeads(this.doc).length === 0;

			if (isNew) {
				this.sendMessage([decodeHashFromBase64(peerId)], {
					type: 'sync',
					message,
				});
			}
		}
	}

	handleSyncMessage(peer: PeerId, message: SyncMessage) {
		const syncState = this.syncStates[peer];
		const [newDoc, newSyncState] = Automerge.receiveSyncMessage(
			this.doc,
			syncState,
			message,
		);

		this.syncStates[peer] = newSyncState;

		this.sendSyncMessage(peer);
	}
}
