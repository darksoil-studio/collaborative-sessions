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

export interface PeerLeftPayload {
	peer: AgentPubKey;
}

export type SessionStoreEvents<MESSAGES> =
	| {
			'peer-joined': (payload: PeerJoinedPayload) => void;
	  }
	| {
			'peer-message': (payload: PeerMessagePayload<MESSAGES>) => void;
	  }
	| {
			'peer-left': (payload: PeerLeftPayload) => void;
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

	get activePeers(): Array<AgentPubKey> {
		return Array.from(this.peers.get().keys());
	}

	joined = true;

	constructor(
		public client: RealTimeSessionsClient,
		public sessionId: string,
		public acceptedPeers:
			| Signal.State<AgentPubKey[]>
			| Signal.Computed<AgentPubKey[]>,
	) {
		super();

		client.onSignal(signal => {
			if (!this.joined) return;
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
					peers.set(signal.provenance, {
						lastSeen: Date.now(),
					});
					break;
				case 'SessionMessage':
					this.emit('peer-message', {
						peer: signal.provenance,
						message: decode(signal.remote_signal.message) as MESSAGES,
					});
					peers.set(signal.provenance, {
						lastSeen: Date.now(),
					});
					break;
				case 'LeaveSession':
					peers.delete(signal.provenance);
					this.emit('peer-left', {
						peer: signal.provenance,
					});
					break;
			}
			this.peers.set(peers);
		});

		let interval: number | undefined;
		effect(() => {
			const peers = this.acceptedPeers.get();
			if (interval) clearInterval(interval);
			interval = setInterval(() => {
				if (!this.joined) return;
				this.client.sendPresenceSignal(
					this.sessionId,
					peers.filter(
						peer =>
							encodeHashToBase64(peer) !==
							encodeHashToBase64(this.client.client.myPubKey),
					),
				);
			}, 3000);
		});
	}

	async join() {
		this.joined = true;
	}

	async sendMessage(peers: AgentPubKey[], message: MESSAGES) {
		if (peers.length === 0) return;
		const messageBytes = encode(message);
		return this.client.sendSessionMessage(
			this.sessionId,
			peers.filter(
				peer =>
					encodeHashToBase64(peer) !==
					encodeHashToBase64(this.client.client.myPubKey),
			),
			messageBytes,
		);
	}

	async leave() {
		this.joined = false;
		return this.client.sendLeaveSesionSignal(this.sessionId, this.activePeers);
	}
}
