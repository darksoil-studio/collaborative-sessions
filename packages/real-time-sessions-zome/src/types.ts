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

export type RemoteSignal =
	| {
			type: 'Presence';
			session_id: string;
	  }
	| {
			type: 'SessionMessage';
			session_id: string;
			message: Uint8Array;
	  }
	| {
			type: 'LeaveSession';
			session_id: string;
	  };

export interface SessionMessage {
	session_id: string;
	message: Uint8Array;
}

export type EntryTypes = never;

export type LinkTypes = string;
