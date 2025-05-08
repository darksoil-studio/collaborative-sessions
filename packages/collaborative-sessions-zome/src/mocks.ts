import {
	AgentPubKeyMap,
	HashType,
	HoloHashMap,
	ZomeMock,
	decodeEntry,
	fakeCreateAction,
	fakeDeleteEntry,
	fakeEntry,
	fakeRecord,
	fakeUpdateEntry,
	hash,
	pickBy,
} from '@darksoil-studio/holochain-utils';
import {
	ActionHash,
	AgentPubKey,
	AppClient,
	Delete,
	EntryHash,
	Link,
	NewEntryAction,
	Record,
	SignedActionHashed,
	decodeHashFromBase64,
	fakeActionHash,
	fakeAgentPubKey,
	fakeDnaHash,
	fakeEntryHash,
} from '@holochain/client';

import { CollaborativeSessionsClient } from './collaborative-sessions-client.js';

export class CollaborativeSessionsZomeMock
	extends ZomeMock
	implements AppClient
{
	constructor(myPubKey?: AgentPubKey) {
		super(
			'collaborative_sessions_test',
			'collaborative_sessions',
			'collaborative_sessions_test_app',
			myPubKey,
		);
	}
}
