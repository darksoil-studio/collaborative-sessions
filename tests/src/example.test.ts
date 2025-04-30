import { assert, test } from "vitest";

import { toPromise } from "@darksoil-studio/holochain-signals";
import { EntryRecord } from "@darksoil-studio/holochain-utils";
import { cleanNodeDecoding } from "@darksoil-studio/holochain-utils/dist/clean-node-decoding.js";
import { ActionHash, Delete, Record, SignedActionHashed } from "@holochain/client";
import { dhtSync, runScenario } from "@holochain/tryorama";
import { decode } from "@msgpack/msgpack";

import { sampleExample } from "../../ui/src/mocks.js";
import { Example } from "../../ui/src/types.js";
import { setup } from "./setup.js";

test("create Example", async () => {
  await runScenario(async scenario => {
    const [alice, bob] = await setup(scenario);

    // Alice creates a Example
    const example: EntryRecord<Example> = await alice.store.client.createExample(
      await sampleExample(alice.store.client),
    );
    assert.ok(example);
  });
});

test("create and read Example", async () => {
  await runScenario(async scenario => {
    const [alice, bob] = await setup(scenario);

    const sample = await sampleExample(alice.store.client);

    // Alice creates a Example
    const example: EntryRecord<Example> = await alice.store.client.createExample(sample);
    assert.ok(example);

    // Wait for the created entry to be propagated to the other node.
    await dhtSync(
      [alice.player, bob.player],
      alice.player.cells[0].cell_id[0],
    );

    // Bob gets the created Example
    const createReadOutput: EntryRecord<Example> = await toPromise(bob.store.examples.get(example.actionHash).original);
    assert.deepEqual(sample, cleanNodeDecoding(createReadOutput.entry));
  });
});

test("create and update Example", async () => {
  await runScenario(async scenario => {
    const [alice, bob] = await setup(scenario);

    // Alice creates a Example
    const example: EntryRecord<Example> = await alice.store.client.createExample(
      await sampleExample(alice.store.client),
    );
    assert.ok(example);

    const originalActionHash = example.actionHash;

    // Alice updates the Example
    let contentUpdate = await sampleExample(alice.store.client);

    let updatedExample: EntryRecord<Example> = await alice.store.client.updateExample(
      originalActionHash,
      originalActionHash,
      contentUpdate,
    );
    assert.ok(updatedExample);

    // Wait for the created entry to be propagated to the other node.
    await dhtSync(
      [alice.player, bob.player],
      alice.player.cells[0].cell_id[0],
    );

    // Bob gets the updated Example
    const readUpdatedOutput0: EntryRecord<Example> = await toPromise(
      bob.store.examples.get(example.actionHash).latestVersion,
    );
    assert.deepEqual(contentUpdate, cleanNodeDecoding(readUpdatedOutput0.entry));

    // Alice updates the Example again
    contentUpdate = await sampleExample(alice.store.client);

    updatedExample = await alice.store.client.updateExample(
      originalActionHash,
      updatedExample.actionHash,
      contentUpdate,
    );
    assert.ok(updatedExample);

    // Wait for the created entry to be propagated to the other node.
    await dhtSync(
      [alice.player, bob.player],
      alice.player.cells[0].cell_id[0],
    );

    // Bob gets the updated Example
    const readUpdatedOutput1: EntryRecord<Example> = await toPromise(
      bob.store.examples.get(originalActionHash).latestVersion,
    );
    assert.deepEqual(contentUpdate, cleanNodeDecoding(readUpdatedOutput1.entry));
  });
});

test("create and delete Example", async () => {
  await runScenario(async scenario => {
    const [alice, bob] = await setup(scenario);

    // Alice creates a Example
    const example: EntryRecord<Example> = await alice.store.client.createExample(
      await sampleExample(alice.store.client),
    );
    assert.ok(example);

    // Alice deletes the Example
    const deleteActionHash = await alice.store.client.deleteExample(example.actionHash);
    assert.ok(deleteActionHash);

    // Wait for the created entry to be propagated to the other node.
    await dhtSync(
      [alice.player, bob.player],
      alice.player.cells[0].cell_id[0],
    );

    // Bob tries to get the deleted Example
    const deletes: Array<SignedActionHashed<Delete>> = await toPromise(
      bob.store.examples.get(example.actionHash).deletes,
    );
    assert.equal(deletes.length, 1);
  });
});
