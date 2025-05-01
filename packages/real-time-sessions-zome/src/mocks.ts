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

import { RealTimeSessionsClient } from './real-time-sessions-client.js';

export class RealTimeSessionsZomeMock extends ZomeMock implements AppClient {
	constructor(myPubKey?: AgentPubKey) {
		super(
			'real_time_sessions_test',
			'real_time_sessions',
			'real_time_sessions_test_app',
			myPubKey,
		);
	}
}
