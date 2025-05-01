import { ActionCommittedSignal } from '@darksoil-studio/holochain-utils';
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
} from '@holochain/client';

export type RealTimeSessionsSignal = {
	provenance: AgentPubKey;
	remote_signal: RemoteSignal;
};

export type RemoteSignal = {
	type: 'SessionMessage';
	session_message: SessionMessage;
};

export interface SessionMessage {
	session_id: string;
	message: Uint8Array;
}

export type EntryTypes = never;

export type LinkTypes = string;
