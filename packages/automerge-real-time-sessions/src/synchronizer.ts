import {
	DocumentId,
	EphemeralMessage,
	Message,
	PeerId,
	RepoMessage,
	SessionId,
	SyncMessage,
} from '@automerge/automerge-repo/slim';
import { SyncState } from '@automerge/automerge/slim';
import { EventEmitter } from 'eventemitter3';

/**
 * Sent by a {@link Repo} to request a document from a peer.
 *
 * @remarks
 * This is identical to a {@link SyncMessage} except that it is sent by a {@link Repo}
 * as the initial sync message when asking the other peer if it has the document.
 * */
export type RequestMessage = {
	type: 'request';
	senderId: PeerId;
	targetId: PeerId;

	/** The automerge sync message */
	data: Uint8Array;

	/** The document ID of the document this message is for */
	documentId: DocumentId;
};

/** These are message types that are handled by the {@link CollectionSynchronizer}.*/
export type DocMessage = SyncMessage | EphemeralMessage | RequestMessage;

/**
 * The contents of a message, without the sender ID or other properties added by the {@link NetworkSubsystem})
 */
export type MessageContents<T extends Message = RepoMessage> =
	T extends EphemeralMessage
		? Omit<T, 'senderId' | 'count' | 'sessionId'>
		: Omit<T, 'senderId'>;

export abstract class Synchronizer extends EventEmitter<SynchronizerEvents> {
	abstract receiveMessage(message: RepoMessage): void;
}

export interface SynchronizerEvents {
	message: (payload: MessageContents) => void;
	'sync-state': (payload: SyncStatePayload) => void;
	// 'open-doc': (arg: OpenDocMessage) => void;
	metrics: (arg: DocSyncMetrics) => void;
}

/** Notify the repo that the sync state has changed  */
export interface SyncStatePayload {
	peerId: PeerId;
	documentId: DocumentId;
	syncState: SyncState;
}

export type DocSyncMetrics =
	| {
			type: 'receive-sync-message';
			documentId: DocumentId;
			durationMillis: number;
			numOps: number;
			numChanges: number;
	  }
	| {
			type: 'doc-denied';
			documentId: DocumentId;
	  };
