import { EntryRecord, ZomeClient } from '@darksoil-studio/holochain-utils';
import {
	ActionHash,
	AgentPubKey,
	AppClient,
	CreateLink,
	Delete,
	DeleteLink,
	EntryHash,
	Link,
	Record,
	SignedActionHashed,
} from '@holochain/client';
import { encode } from '@msgpack/msgpack';

import { CollaborativeSessionsSignal } from './types.js';

export class CollaborativeSessionsClient extends ZomeClient<CollaborativeSessionsSignal> {
	constructor(
		public client: AppClient,
		public roleName: string,
		public zomeName = 'collaborative_sessions',
	) {
		super(client, roleName, zomeName);
	}

	async sendPresenceSignal(sessionId: string, peers: AgentPubKey[]) {
		return this.callZome('send_presence_signal', {
			session_id: sessionId,
			peers,
		});
	}

	async sendSessionMessage(
		sessionId: string,
		peers: AgentPubKey[],
		message: Uint8Array,
	) {
		return this.callZome('send_session_message', {
			session_message: { session_id: sessionId, message },
			peers,
		});
	}

	async sendLeaveSesionSignal(sessionId: string, peers: AgentPubKey[]) {
		return this.callZome('send_leave_session_signal', {
			session_id: sessionId,
			peers,
		});
	}
}
