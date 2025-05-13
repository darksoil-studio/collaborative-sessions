import { next as Automerge } from '@automerge/automerge';
import {
	MappedSchemaSpec,
	SchemaAdapter,
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
import { EditorState, Plugin, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { prosemirrorMenuStyles, prosemirrorStyles } from './styles.js';

@customElement('collaborative-prosemirror')
export class CollaborativeProsemirror extends SignalWatcher(LitElement) {
	@property()
	sessionId!: string;

	@property()
	value!: string;

	@property()
	initialDoc: Automerge.Doc<{ text: string }> | undefined;

	_acceptedCollaborators = new Signal.State<AgentPubKey[]>(
		this.acceptedCollaborators,
	);
	set acceptedCollaborators(collaborators: Array<AgentPubKey>) {
		this._acceptedCollaborators.set(collaborators);
	}
	get acceptedCollaborators() {
		return this._acceptedCollaborators ? this._acceptedCollaborators.get() : [];
	}

	@property()
	plugins: Array<Plugin<unknown>> = [];

	@property()
	schema: MappedSchemaSpec | undefined;

	@consume({ context: collaborativeSessionsClientContext })
	client!: CollaborativeSessionsClient;

	@query('#editor')
	el!: HTMLElement;

	prosemirror!: EditorView;

	public document!: DocumentStore<{ text: string }>;

	firstUpdated() {
		const adapter = this.schema
			? new SchemaAdapter(this.schema)
			: basicSchemaAdapter;
		const initialDoc = this.initialDoc
			? this.initialDoc
			: Automerge.from({
					text: this.value || '',
				});

		this.document = new DocumentStore<{ text: string }>(
			this.client,
			this.sessionId,
			this._acceptedCollaborators,
			initialDoc,
		);

		this.prosemirror = new EditorView(this.el, {
			state: EditorState.create({
				doc: pmDocFromSpans(
					adapter,
					Automerge.spans(this.document.docSync()!, ['text']),
				),
				plugins: [
					...this.plugins,
					syncPlugin({
						adapter: adapter,
						handle: this.document,
						path: ['text'],
					}),
				],
			}),
			dispatchTransaction: (tx: Transaction) => {
				this.prosemirror!.updateState(this.prosemirror!.state.apply(tx));
			},
		});
	}

	render() {
		return html`<div id="editor" style="display:flex; flex: 1"></div>`;
	}

	static styles = [
		css`
			:host {
				display: flex;
			}
			[contenteditable]:active,
			[contenteditable]:focus {
				border: none;
				outline: none;
			}
			.ProseMirror {
				flex: 1;
			}
			p {
				margin: 0;
			}
		`,
		prosemirrorStyles,
		prosemirrorMenuStyles,
		sharedStyles,
	];
}
