import { assert, test } from "vitest";

import { toPromise } from "@darksoil-studio/holochain-signals";
import { EntryRecord } from "@darksoil-studio/holochain-utils";
import { ActionHash, EntryHash, Record } from "@holochain/client";
import { dhtSync, runScenario } from "@holochain/tryorama";
import { decode } from "@msgpack/msgpack";

import { sampleExample } from "../../ui/src/mocks.js";
import { Example } from "../../ui/src/types.js";
import { setup } from "./setup.js";

test("create a Example and get all examples", async () => {
  await runScenario(async scenario => {
    const [alice, bob] = await setup(scenario);

    // Bob gets all examples
    let collectionOutput = await toPromise(bob.store.allExamples);
    assert.equal(collectionOutput.size, 0);

    // Alice creates a Example
    const example: EntryRecord<Example> = await alice.store.client.createExample(
      await sampleExample(alice.store.client),
    );
    assert.ok(example);

    await dhtSync(
      [alice.player, bob.player],
      alice.player.cells[0].cell_id[0],
    );

    // Bob gets all examples again
    collectionOutput = await toPromise(bob.store.allExamples);
    assert.equal(collectionOutput.size, 1);
    assert.deepEqual(example.actionHash, Array.from(collectionOutput.keys())[0]);
  });
});
