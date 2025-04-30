import { 
  SignedActionHashed,
  CreateLink,
  Link,
  DeleteLink,
  Delete,
  AppClient, 
  Record, 
  ActionHash, 
  EntryHash, 
  AgentPubKey,
} from '@holochain/client';
import { EntryRecord, ZomeClient } from '@darksoil-studio/holochain-utils';

import { RealTimeSessionsSignal } from './types.js';

export class RealTimeSessionsClient extends ZomeClient<RealTimeSessionsSignal> {

  constructor(public client: AppClient, public roleName: string, public zomeName = 'real_time_sessions') {
    super(client, roleName, zomeName);
  }
}
