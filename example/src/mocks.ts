import { Example } from "./types.js";

import {
  AgentPubKeyMap,
  decodeEntry,
  fakeCreateAction,
  fakeDeleteEntry,
  fakeEntry,
  fakeRecord,
  fakeUpdateEntry,
  hash,
  HashType,
  HoloHashMap,
  pickBy,
  ZomeMock,
} from "@darksoil-studio/holochain-utils";
import {
  ActionHash,
  AgentPubKey,
  AppClient,
  decodeHashFromBase64,
  Delete,
  EntryHash,
  fakeActionHash,
  fakeAgentPubKey,
  fakeDnaHash,
  fakeEntryHash,
  Link,
  NewEntryAction,
  Record,
  SignedActionHashed,
} from "@holochain/client";
import { ExampleClient } from "./example-client.js";

export class ExampleZomeMock extends ZomeMock implements AppClient {
  constructor(
    myPubKey?: AgentPubKey,
  ) {
    super("collaborative_sessions_test", "collaborative_sessions", "collaborative_sessions_test_app", myPubKey);
  }
  /** Example */
  examples = new HoloHashMap<ActionHash, {
    deletes: Array<SignedActionHashed<Delete>>;
    revisions: Array<Record>;
  }>();

  async create_example(example: Example): Promise<Record> {
    const entryHash = hash(example, HashType.ENTRY);
    const record = await fakeRecord(await fakeCreateAction(entryHash), fakeEntry(example));

    this.examples.set(record.signed_action.hashed.hash, {
      deletes: [],
      revisions: [record],
    });

    return record;
  }

  async get_latest_example(exampleHash: ActionHash): Promise<Record | undefined> {
    const example = this.examples.get(exampleHash);
    return example ? example.revisions[example.revisions.length - 1] : undefined;
  }

  async get_all_revisions_for_example(exampleHash: ActionHash): Promise<Record[] | undefined> {
    const example = this.examples.get(exampleHash);
    return example ? example.revisions : undefined;
  }

  async get_original_example(exampleHash: ActionHash): Promise<Record | undefined> {
    const example = this.examples.get(exampleHash);
    return example ? example.revisions[0] : undefined;
  }

  async get_all_deletes_for_example(exampleHash: ActionHash): Promise<Array<SignedActionHashed<Delete>> | undefined> {
    const example = this.examples.get(exampleHash);
    return example ? example.deletes : undefined;
  }

  async get_oldest_delete_for_example(exampleHash: ActionHash): Promise<SignedActionHashed<Delete> | undefined> {
    const example = this.examples.get(exampleHash);
    return example ? example.deletes[0] : undefined;
  }
  async delete_example(original_example_hash: ActionHash): Promise<ActionHash> {
    const record = await fakeRecord(await fakeDeleteEntry(original_example_hash));

    this.examples.get(original_example_hash).deletes.push(record.signed_action as SignedActionHashed<Delete>);

    return record.signed_action.hashed.hash;
  }

  async update_example(
    input: { original_example_hash: ActionHash; previous_example_hash: ActionHash; updated_example: Example },
  ): Promise<Record> {
    const record = await fakeRecord(
      await fakeUpdateEntry(input.previous_example_hash, undefined, undefined, fakeEntry(input.updated_example)),
      fakeEntry(input.updated_example),
    );

    this.examples.get(input.original_example_hash).revisions.push(record);

    const example = input.updated_example;

    return record;
  }

  async get_all_examples(): Promise<Array<Link>> {
    const records: Record[] = Array.from(this.examples.values()).map(r => r.revisions[r.revisions.length - 1]);
    const base = await fakeEntryHash();
    return Promise.all(records.map(async record => ({
      base,
      target: record.signed_action.hashed.hash,
      author: record.signed_action.hashed.content.author,
      timestamp: record.signed_action.hashed.content.timestamp,
      zome_index: 0,
      link_type: 0,
      tag: new Uint8Array(),
      create_link_hash: await fakeActionHash(),
    })));
  }
}

export async function sampleExample(client: ExampleClient, partialExample: Partial<Example> = {}): Promise<Example> {
  return {
    ...{
      text: "Lorem ipsum 2",
    },
    ...partialExample,
  };
}
