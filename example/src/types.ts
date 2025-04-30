import { ActionCommittedSignal } from "@darksoil-studio/holochain-utils";
import {
  ActionHash,
  AgentPubKey,
  Create,
  CreateLink,
  Delete,
  DeleteLink,
  DnaHash,
  EntryHash,
  Record,
  SignedActionHashed,
  Update,
} from "@holochain/client";

export type ExampleSignal = ActionCommittedSignal<EntryTypes, LinkTypes>;

export type EntryTypes = { type: "Example" } & Example;

export type LinkTypes = string;

export interface Example {
  text: string;
}
