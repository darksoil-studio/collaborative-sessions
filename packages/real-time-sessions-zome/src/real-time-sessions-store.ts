import { 
  collectionSignal, 
  liveLinksSignal, 
  deletedLinksSignal, 
  allRevisionsOfEntrySignal,
  latestVersionOfEntrySignal, 
  immutableEntrySignal, 
  deletesForEntrySignal, 
  AsyncComputed,
  pipe,
} from "@darksoil-studio/holochain-signals";
import { slice, HashType, retype, EntryRecord, MemoHoloHashMap } from "@darksoil-studio/holochain-utils";
import { NewEntryAction, Record, ActionHash, EntryHash, AgentPubKey } from '@holochain/client';

import { RealTimeSessionsClient } from './real-time-sessions-client.js';

export class RealTimeSessionsStore {

  constructor(public client: RealTimeSessionsClient) {}
  
}
