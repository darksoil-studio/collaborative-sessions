import { Example } from "./types.js";

import {
  allRevisionsOfEntrySignal,
  AsyncComputed,
  collectionSignal,
  deletedLinksSignal,
  deletesForEntrySignal,
  immutableEntrySignal,
  latestVersionOfEntrySignal,
  liveLinksSignal,
  pipe,
} from "@darksoil-studio/holochain-signals";
import { EntryRecord, HashType, MemoHoloHashMap, retype, slice } from "@darksoil-studio/holochain-utils";
import { ActionHash, AgentPubKey, EntryHash, NewEntryAction, Record } from "@holochain/client";

import { ExampleClient } from "./example-client.js";

export class ExampleStore {
  constructor(public client: ExampleClient) {}

  /** Example */

  examples = new MemoHoloHashMap((exampleHash: ActionHash) => ({
    latestVersion: latestVersionOfEntrySignal(this.client, () => this.client.getLatestExample(exampleHash)),
    original: immutableEntrySignal(() => this.client.getOriginalExample(exampleHash)),
    allRevisions: allRevisionsOfEntrySignal(this.client, () => this.client.getAllRevisionsForExample(exampleHash)),
    deletes: deletesForEntrySignal(this.client, exampleHash, () => this.client.getAllDeletesForExample(exampleHash)),
  }));

  /** All Examples */

  allExamples = pipe(
    collectionSignal(
      this.client,
      () => this.client.getAllExamples(),
      "AllExamples",
    ),
    allExamples => slice(this.examples, allExamples.map(l => l.target)),
  );
}
