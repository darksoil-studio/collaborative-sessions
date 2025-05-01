import {
	NetworkAdapter as AutomergeNetworkAdapter,
	Message,
	PeerId,
	PeerMetadata,
} from '@automerge/automerge-repo/slim';
import {
	PeerJoinedPayload,
	PeerMessagePayload,
	RealTimeSessionsClient,
	RealTimeSessionsStore,
	SessionStore,
} from '@darksoil-studio/real-time-sessions-zome';
import { decodeHashFromBase64, encodeHashToBase64 } from '@holochain/client';

export class RealTimeSessionsNetworkAdapter extends AutomergeNetworkAdapter {
	constructor(public sessionStore: SessionStore<Message>) {
		super();
	}

	isReady(): boolean {
		return true;
	}

	async whenReady(): Promise<void> {}

	connect(peerId: PeerId, peerMetadata?: PeerMetadata): void {
		this.sessionStore.on(
			'peer-message',
			(peerMessage: PeerMessagePayload<Message>) => {
				this.emit('message', peerMessage.message);
			},
		);
		this.sessionStore.on('peer-joined', (peer: PeerJoinedPayload) => {
			this.emit('peer-candidate', {
				peerId: encodeHashToBase64(peer.peer) as PeerId,
				peerMetadata: {
					isEphemeral: false,
					storageId: undefined,
				},
			});
		});
	}

	disconnect(): void {}

	async send(message: Message) {
		if (!message.documentId || !message.data) return; // TODO: whaaat?

		// await sessionStore.join();
		await this.sessionStore.sendMessage(
			[decodeHashFromBase64(message.targetId)],
			message,
		);
	}
}
