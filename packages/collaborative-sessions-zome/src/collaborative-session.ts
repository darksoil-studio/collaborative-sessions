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
import { RemoteSignal } from './types.js';
import { effect } from './utils.js';

export interface MessageReceivedPayload<MESSAGES> {
	collaborator: AgentPubKey;
	message: MESSAGES;
}

export interface CollaboratorJoinedPayload {
	collaborator: AgentPubKey;
}

export interface CollaboratorLeftPayload {
	collaborator: AgentPubKey;
}

export type CollaborativeSessionEvents<MESSAGES> =
	| {
			'collaborator-joined': (payload: CollaboratorJoinedPayload) => void;
	  }
	| {
			'message-received': (payload: MessageReceivedPayload<MESSAGES>) => void;
	  }
	| {
			'collaborator-left': (payload: CollaboratorLeftPayload) => void;
	  };

export interface CollaboratorState {
	lastSeen: number;
}

export class CollaborativeSession<MESSAGES> extends EventEmitter<
	CollaborativeSessionEvents<MESSAGES>
> {
	collaborators = new Signal.State<HoloHashMap<AgentPubKey, CollaboratorState>>(
		new HoloHashMap(),
	);

	get activeCollaborators(): Array<AgentPubKey> {
		return Array.from(this.collaborators.get().keys());
	}

	joined = true;

	ignoredMessages: HoloHashMap<AgentPubKey, RemoteSignal[]> = new HoloHashMap();

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
				if (!this.ignoredMessages.has(signal.provenance)) {
					this.ignoredMessages.set(signal.provenance, []);
				}
				this.ignoredMessages.get(signal.provenance).push(signal.remote_signal);

				// TODO: implement rate limiting

				return;
			}

			this.handleCollaboratorMessage(signal.provenance, signal.remote_signal);
		});

		let interval: number | undefined;
		effect(() => {
			const collaborators = this.acceptedCollaborators.get();

			for (const [ignoredCollaborator, messages] of Array.from(
				this.ignoredMessages.entries(),
			)) {
				if (
					collaborators.find(
						c =>
							encodeHashToBase64(c) === encodeHashToBase64(ignoredCollaborator),
					)
				) {
					for (const message of messages) {
						this.handleCollaboratorMessage(ignoredCollaborator, message);
					}
					this.ignoredMessages.delete(ignoredCollaborator);
				}
			}

			if (interval) clearInterval(interval);
			interval = setInterval(() => {
				if (!this.joined) return;
				this.client.sendPresenceSignal(
					this.sessionId,
					collaborators.filter(
						peer =>
							encodeHashToBase64(peer) !==
							encodeHashToBase64(this.client.client.myPubKey),
					),
				);
			}, 3000);
		});
	}

	private handleCollaboratorMessage(
		collaborator: AgentPubKey,
		message: RemoteSignal,
	) {
		const collaborators = this.collaborators.get();
		const collaboratorState = collaborators.get(collaborator);

		switch (message.type) {
			case 'Presence':
				if (!collaboratorState) {
					this.emit('collaborator-joined', {
						collaborator,
					});
				}
				collaborators.set(collaborator, {
					lastSeen: Date.now(),
				});
				break;
			case 'SessionMessage':
				this.emit('message-received', {
					collaborator,
					message: decode(message.message) as MESSAGES,
				});
				collaborators.set(collaborator, {
					lastSeen: Date.now(),
				});
				break;
			case 'LeaveSession':
				collaborators.delete(collaborator);
				this.emit('collaborator-left', {
					collaborator,
				});
				break;
		}
		this.collaborators.set(collaborators);
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
