import { next as A } from '@automerge/automerge';
import { DocumentId, Repo } from '@automerge/automerge-repo';
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb';
import {
	DocHandle,
	basicSchemaAdapter,
	pmDocFromSpans,
	syncPlugin,
} from '@automerge/prosemirror';
import '@darksoil-studio/automerge-real-time-sessions';
import { RealTimeSessionsNetworkAdapter } from '@darksoil-studio/automerge-real-time-sessions';
import { sharedStyles } from '@darksoil-studio/holochain-elements';
import { SignalWatcher } from '@darksoil-studio/holochain-signals';
import {
	RealTimeSessionsStore,
	realTimeSessionsStoreContext,
} from '@darksoil-studio/real-time-sessions-zome';
import { consume } from '@lit/context';
import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { exampleSetup } from 'prosemirror-example-setup';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

@customElement('collaborative-prosemirror')
export class CollaborativeProsemirror extends SignalWatcher(LitElement) {
	@property({ attribute: 'session-id', type: String })
	sessionId!: string;

	@query('#editor')
	el!: HTMLElement;

	@consume({ context: realTimeSessionsStoreContext, subscribe: true })
	realTimeSessionsStore!: RealTimeSessionsStore;

	prosemirror!: EditorView;

	async firstUpdated() {
		const adapter = basicSchemaAdapter;

		const repo = new Repo({
			network: [
				new RealTimeSessionsNetworkAdapter(this.realTimeSessionsStore.client),
			],
			storage: new IndexedDBStorageAdapter(),
		});

		const handle: DocHandle<{ text: string }> = await repo.find(
			this.sessionId as DocumentId,
		);

		this.prosemirror = new EditorView(this.el, {
			state: EditorState.create({
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
		return html`<div id="editor"></div>`;
	}

	static styles = sharedStyles;
}
