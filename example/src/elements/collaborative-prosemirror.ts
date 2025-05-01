import { next as A, encodeChange } from '@automerge/automerge';
import {
	AnyDocumentId,
	BinaryDocumentId,
	DocHandle,
	DocumentId,
	PeerId,
	Repo,
	RepoConfig,
} from '@automerge/automerge-repo';
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb';
import {
	basicSchemaAdapter,
	pmDocFromSpans,
	syncPlugin,
} from '@automerge/prosemirror';
import '@darksoil-studio/automerge-real-time-sessions';
import {
	DocumentStore,
	RealTimeSessionsNetworkAdapter,
} from '@darksoil-studio/automerge-real-time-sessions';
import { sharedStyles } from '@darksoil-studio/holochain-elements';
import {
	Signal,
	SignalWatcher,
	joinAsyncMap,
	toPromise,
} from '@darksoil-studio/holochain-signals';
import { mapValues } from '@darksoil-studio/holochain-utils';
import {
	ProfilesStore,
	profilesStoreContext,
} from '@darksoil-studio/profiles-zome';
import {
	RealTimeSessionsClient,
	RealTimeSessionsStore,
	SessionStore,
	realTimeSessionsStoreContext,
} from '@darksoil-studio/real-time-sessions-zome';
import {
	AgentPubKey,
	decodeHashFromBase64,
	encodeHashToBase64,
} from '@holochain/client';
import { consume } from '@lit/context';
import { LitElement, css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { exampleSetup } from 'prosemirror-example-setup';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { prosemirrorMenuStyles, prosemirrorStyles } from './prosemirror.js';

// export class StorageAdapter extends IndexedDBStorageAdapter {
// 	constructor() {
// 		super();
// 	}

// 	async load(keyArray: string[]): Promise<Uint8Array | undefined> {
// 		let data = await super.load(keyArray);
// 		if (!data) {
// 		}
// 		return data;
// 	}
// }

// export class CustomRepo extends Repo {
// 	constructor(repoConfig?: RepoConfig) {
// 		super(repoConfig);
// 	}

// 	join<T>(documentId: AnyDocumentId, currentValue: T) {
// 		try {
// 			return super.find(documentId);
// 		} catch (e) {
// 	    const handle = super.#getHandle<T>({
// 	      documentId,
// 	    }) as DocHandle<T>

// 	    this.#registerHandleWithSubsystems(handle)

// 	    handle.update(() => {
// 	      let nextDoc: A.Doc<T>
// 	      if (currentValue) {
// 	        nextDoc = A.from(currentValue)
// 	      } else {
// 	        nextDoc = A.emptyChange(A.init())
// 	      }
// 	      return nextDoc
// 	    })

// 	    handle.doneLoading()
// 	    return handle

// 		}
// 	}
// }

@customElement('collaborative-prosemirror')
export class CollaborativeProsemirror extends SignalWatcher(LitElement) {
	@property({ attribute: 'document-id', type: String })
	documentId!: AnyDocumentId;

	@query('#editor')
	el!: HTMLElement;

	prosemirror!: EditorView;

	// @consume({ context: documentsStoreContext, subscribe: true })
	// documentsStore!: DocumentsStore;

	@consume({ context: profilesStoreContext, subscribe: true })
	profilesStore!: ProfilesStore;

	async firstUpdated() {
		const allAgents = new Signal.Computed<AgentPubKey[]>(() => {
			const allProfiles = this.profilesStore.allProfiles.get();
			if (allProfiles.status !== 'completed') return [];

			const originals = joinAsyncMap(
				mapValues(allProfiles.value, v => v.original.get()),
			);
			if (originals.status !== 'completed') return [];

			const agents = Array.from(originals.value.values()).map(
				r => r.action.author,
			);

			return agents;
		});

		const adapter = basicSchemaAdapter;

		const documentStore = new DocumentStore<{ text: string }>(
			new SessionStore(
				new RealTimeSessionsClient(
					this.profilesStore.client.client,
					this.profilesStore.client.roleName,
				),
				this.documentId as string,
				allAgents,
			),
		);

		const handle = await documentStore.docHandle();

		await handle.whenReady();

		this.prosemirror = new EditorView(this.el, {
			state: EditorState.create({
				doc: pmDocFromSpans(adapter, A.spans(handle.docSync()!, ['text'])),
				plugins: [
					...exampleSetup({ schema: adapter.schema }),
					syncPlugin({ adapter, handle, path: ['text'] }),
				],
			}),
			dispatchTransaction: (tx: Transaction) => {
				this.prosemirror!.updateState(this.prosemirror!.state.apply(tx));
			},
		});
	}

	render() {
		return html`<div id="editor" style="flex: 1"></div>`;
	}

	static styles = [
		css`
			:host {
				display: flex;
			}
		`,
		prosemirrorStyles,
		prosemirrorMenuStyles,
		sharedStyles,
	];
}
