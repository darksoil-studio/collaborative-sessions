import {
	NetworkAdapter as AutomergeNetworkAdapter,
	Message,
	PeerId,
	PeerMetadata,
} from '@automerge/automerge-repo/slim';
import {
	RealTimeSessionsClient,
	SessionStore,
} from '@darksoil-studio/real-time-sessions-zome';
import { decodeHashFromBase64 } from '@holochain/client';

export class RealTimeSessionsNetworkAdapter extends AutomergeNetworkAdapter {
	sessions: Record<string, SessionStore<Message>> = {};

	constructor(public client: RealTimeSessionsClient) {
		super();
	}

	isReady(): boolean {
		return true;
	}

	whenReady(): Promise<void> {
		return Promise.resolve();
	}

	connect(peerId: PeerId, peerMetadata?: PeerMetadata): void {}

	disconnect(): void {}

	private joinSession(documentId: string) {
		const sessionStore = new SessionStore<Message>(this.client, documentId);
		sessionStore.on('peer-message', message => this.emit('message', message));
		this.sessions[documentId] = sessionStore;
	}

	async send(message: Message) {
		if (!message.documentId || !message.data) return; // TODO: whaaat?

		if (!this.sessions[message.documentId]) {
			this.joinSession(message.documentId);
		}
		const sessionStore = this.sessions[message.documentId];

		// await sessionStore.join();

		await sessionStore.sendMessage(
			[decodeHashFromBase64(message.targetId)],
			message,
		);
	}
}
