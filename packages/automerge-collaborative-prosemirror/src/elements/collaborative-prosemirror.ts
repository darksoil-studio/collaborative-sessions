import { next as Automerge } from '@automerge/automerge';
import {
	basicSchemaAdapter,
	pmDocFromSpans,
	syncPlugin,
} from '@automerge/prosemirror';
import { DocumentStore } from '@darksoil-studio/automerge-collaborative-sessions';
import {
	CollaborativeSessionsClient,
	collaborativeSessionsClientContext,
} from '@darksoil-studio/collaborative-sessions-zome';
import { sharedStyles } from '@darksoil-studio/holochain-elements';
import { Signal, SignalWatcher } from '@darksoil-studio/holochain-signals';
import { AgentPubKey } from '@holochain/client';
import { consume } from '@lit/context';
import { LitElement, css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { exampleSetup } from 'prosemirror-example-setup';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { prosemirrorMenuStyles, prosemirrorStyles } from './styles.js';

@customElement('collaborative-prosemirror')
export class CollaborativeProsemirror extends SignalWatcher(LitElement) {
	@property()
	sessionId!: string;

	@property()
	value!: string;

	_acceptedCollaborators = new Signal.State<AgentPubKey[]>(
		this.acceptedCollaborators,
	);
	set acceptedCollaborators(collaborators: Array<AgentPubKey>) {
		this._acceptedCollaborators.set(collaborators);
	}
	get acceptedCollaborators() {
		return this._acceptedCollaborators ? this._acceptedCollaborators.get() : [];
	}

	@consume({ context: collaborativeSessionsClientContext })
	client!: CollaborativeSessionsClient;

	@query('#editor')
	el!: HTMLElement;

	prosemirror!: EditorView;

	async firstUpdated() {
		const adapter = basicSchemaAdapter;
		const initialValue = Automerge.from({
			text: this.value || '',
		});

		const documentStore = new DocumentStore<{ text: string }>(
			this.client,
			this.sessionId,
			this._acceptedCollaborators,
			initialValue,
		);

		this.prosemirror = new EditorView(this.el, {
			state: EditorState.create({
				doc: pmDocFromSpans(
					adapter,
					Automerge.spans(documentStore.docSync()!, ['text']),
				),
				plugins: [
					...exampleSetup({ schema: adapter.schema }),
					syncPlugin({ adapter, handle: documentStore, path: ['text'] }),
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
