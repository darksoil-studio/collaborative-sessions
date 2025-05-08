import { Signal, toPromise } from '@darksoil-studio/holochain-signals';
import { EntryRecord } from '@darksoil-studio/holochain-utils';
import { cleanNodeDecoding } from '@darksoil-studio/holochain-utils/dist/clean-node-decoding.js';
import {
	ActionHash,
	Delete,
	Record,
	SignedActionHashed,
} from '@holochain/client';
import { dhtSync, pause, runScenario } from '@holochain/tryorama';
import { decode } from '@msgpack/msgpack';
import { assert, test } from 'vitest';

import { CollaborativeSession } from '../../packages/collaborative-sessions-zome/src/collaborative-session.js';
import { setup } from './setup.js';

test('active collaborators', async () => {
	await runScenario(async scenario => {
		const [alice, bob] = await setup(scenario);

		const sessionId = 'mysession';

		const aliceSession = new CollaborativeSession(
			alice.client,
			sessionId,
			new Signal.State([bob.player.agentPubKey]),
		);
		assert.equal(aliceSession.activeCollaborators.length, 0);

		const bobSession = new CollaborativeSession(
			bob.client,
			sessionId,
			new Signal.State([alice.player.agentPubKey]),
		);

		await pause(10000);

		assert.equal(bobSession.activeCollaborators.length, 1);
		assert.equal(aliceSession.activeCollaborators.length, 1);
	});
});
