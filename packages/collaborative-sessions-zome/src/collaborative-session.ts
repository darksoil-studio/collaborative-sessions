import {
	AsyncComputed,
	Signal,
	watch,
} from '@darksoil-studio/holochain-signals';
import { HoloHashMap } from '@darksoil-studio/holochain-utils';
import { AgentPubKey, encodeHashToBase64 } from '@holochain/client';
import { decode, encode } from '@msgpack/msgpack';
import { EventEmitter } from 'eventemitter3';

import { CollaborativeSessionsClient } from './collaborative-sessions-client.js';
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

export type CollaborativeSessionEvents<MESSAGES> =
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

export class CollaborativeSession<MESSAGES> extends EventEmitter<
	CollaborativeSessionEvents<MESSAGES>
> {
	collaborators = new Signal.State<HoloHashMap<AgentPubKey, PeerState>>(
		new HoloHashMap(),
	);

	get activeCollaborators(): Array<AgentPubKey> {
		return Array.from(this.collaborators.get().keys());
	}

	joined = true;

	constructor(
		public client: CollaborativeSessionsClient,
		public sessionId: string,
		public acceptedCollaborators:
			| Signal.State<AgentPubKey[]>
			| Signal.Computed<AgentPubKey[]>,
	) {
		super();

		client.onSignal(signal => {
			if (!this.joined) return;
			if (signal.remote_signal.session_id !== this.sessionId) return;

			const acceptedCollaborators = this.acceptedCollaborators.get();
			if (
				!acceptedCollaborators.find(
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

			const peers = this.collaborators.get();
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
			this.collaborators.set(peers);
		});

		let interval: number | undefined;
		effect(() => {
			const peers = this.acceptedCollaborators.get();
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
		const peers = this.acceptedCollaborators.get();
		return this.client.sendPresenceSignal(
			this.sessionId,
			peers.filter(
				peer =>
					encodeHashToBase64(peer) !==
					encodeHashToBase64(this.client.client.myPubKey),
			),
		);
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
		return this.client.sendLeaveSesionSignal(
			this.sessionId,
			this.activeCollaborators,
		);
	}
}
