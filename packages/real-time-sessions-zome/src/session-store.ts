import { AsyncComputed, Signal } from '@darksoil-studio/holochain-signals';
import { HoloHashMap } from '@darksoil-studio/holochain-utils';
import { AgentPubKey } from '@holochain/client';
import { decode, encode } from '@msgpack/msgpack';
import { EventEmitter } from 'eventemitter3';

import { RealTimeSessionsClient } from './real-time-sessions-client.js';

export type SessionStoreEvents<MESSAGES> = {
	'peer-message': {
		peer: AgentPubKey;
		message: MESSAGES;
	};
};

export interface PeerState {
	lastSeen: number;
}

export class SessionStore<MESSAGES> extends EventEmitter<
	SessionStoreEvents<MESSAGES>
> {
	peers = new Signal.State<HoloHashMap<AgentPubKey, PeerState>>(
		new HoloHashMap(),
	);

	activePeers = new Signal.Computed(() => Array.from(this.peers.get().keys()));

	constructor(
		public client: RealTimeSessionsClient,
		public sessionId: string,
	) {
		super();

		client.onSignal(signal => {
			if (signal.remote_signal.session_message.session_id !== this.sessionId)
				return;

			this.emit('peer-message', {
				peer: signal.provenance,
				message: decode(signal.remote_signal.session_message.message),
			});
		});
	}

	async sendMessage(peers: AgentPubKey[], message: MESSAGES) {
		const messageBytes = encode(message);
		return this.client.sendSessionMessage(this.sessionId, peers, messageBytes);
	}

	async join() {}

	async leave() {}
}
