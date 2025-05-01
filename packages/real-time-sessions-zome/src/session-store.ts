import {
	AsyncComputed,
	Signal,
	watch,
} from '@darksoil-studio/holochain-signals';
import { HoloHashMap } from '@darksoil-studio/holochain-utils';
import { AgentPubKey, encodeHashToBase64 } from '@holochain/client';
import { decode, encode } from '@msgpack/msgpack';
import { EventEmitter } from 'eventemitter3';

import { RealTimeSessionsClient } from './real-time-sessions-client.js';
import { effect } from './utils.js';

export interface PeerMessagePayload<MESSAGES> {
	peer: AgentPubKey;
	message: MESSAGES;
}

export interface PeerJoinedPayload {
	peer: AgentPubKey;
}

export type SessionStoreEvents<MESSAGES> =
	| {
			'peer-message': (payload: PeerMessagePayload<MESSAGES>) => void;
	  }
	| {
			'peer-joined': (payload: PeerJoinedPayload) => void;
	  };

export interface PeerState {
	lastSeen: number;
}

export class SessionStore<
	MESSAGES,
	EVENTS extends Record<string, unknown>,
> extends EventEmitter<SessionStoreEvents<MESSAGES> | EVENTS> {
	peers = new Signal.State<HoloHashMap<AgentPubKey, PeerState>>(
		new HoloHashMap(),
	);

	activePeers = new Signal.Computed(() => Array.from(this.peers.get().keys()));

	constructor(
		public client: RealTimeSessionsClient,
		public sessionId: string,
		public acceptedPeers:
			| Signal.State<AgentPubKey[]>
			| Signal.Computed<AgentPubKey[]>,
	) {
		super();

		client.onSignal(signal => {
			if (signal.remote_signal.session_id !== this.sessionId) return;

			const acceptedPeers = this.acceptedPeers.get();
			if (
				!acceptedPeers.find(
					acceptedPeer =>
						encodeHashToBase64(acceptedPeer) ===
						encodeHashToBase64(signal.provenance),
				)
			) {
				console.warn(
					`Received a message from an invalid peer ${encodeHashToBase64(signal.provenance)}: ignoring.`,
				);
				return;
			}

			const peers = this.peers.get();
			const peer = peers.get(signal.provenance);

			switch (signal.remote_signal.type) {
				case 'Presence':
					if (!peer) {
						this.emit('peer-joined', {
							peer: signal.provenance,
						});
					}
					break;
				case 'SessionMessage':
					this.emit('peer-message', {
						peer: signal.provenance,
						message: decode(signal.remote_signal.message) as MESSAGES,
					});
					break;
			}
			peers.set(signal.provenance, {
				lastSeen: Date.now(),
			});
			this.peers.set(peers);
		});

		let interval: number | undefined;
		effect(() => {
			const peers = this.acceptedPeers.get();
			if (interval) clearInterval(interval);
			interval = setInterval(() => {
				this.client.sendPresenceSignal(this.sessionId, peers);
			}, 3000);
		});
	}

	// async join() {
	// 	await this.client.sendPresenceSignal(
	// 		this.sessionId,
	// 		this.acceptedPeers
	// 			.get()
	// 			.filter(
	// 				p =>
	// 					encodeHashToBase64(p) !==
	// 					encodeHashToBase64(this.client.client.myPubKey),
	// 			),
	// 	);
	// }

	async sendMessage(peers: AgentPubKey[], message: MESSAGES) {
		const messageBytes = encode(message);
		return this.client.sendSessionMessage(this.sessionId, peers, messageBytes);
	}

	async leave() {}
}
