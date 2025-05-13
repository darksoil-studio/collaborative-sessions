import { next as Automerge } from '@automerge/automerge';
import {
	MappedSchemaSpec,
	SchemaAdapter,
	basicSchemaAdapter,
	pmDocFromSpans,
	syncPlugin,
} from '@automerge/prosemirror';
import {
	DocHandleChangePayload,
	DocumentStore,
} from '@darksoil-studio/automerge-collaborative-sessions';
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
	initialDocument: Automerge.Doc<unknown> | undefined;

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

	@property()
	path: string[] = ['text'];

	@consume({ context: collaborativeSessionsClientContext })
	client!: CollaborativeSessionsClient;

	@query('#editor')
	el!: HTMLElement;

	prosemirror!: EditorView;

	public document!: DocumentStore<unknown>;

	firstUpdated() {
		const adapter = this.schema
			? new SchemaAdapter(this.schema)
			: basicSchemaAdapter;
		const initialDoc = this.initialDocument
			? this.initialDocument
			: Automerge.from({
					text: this.value || '',
				});

		this.document = new DocumentStore<unknown>(
			this.client,
			this.sessionId,
			this._acceptedCollaborators,
			initialDoc,
		);

		this.document.on('change', (change: DocHandleChangePayload<unknown>) => {
			this.dispatchEvent(
				new CustomEvent('document-change', {
					bubbles: true,
					composed: true,
					detail: {
						change,
					},
				}),
			);
		});

		this.prosemirror = new EditorView(this.el, {
			state: EditorState.create({
				doc: pmDocFromSpans(
					adapter,
					Automerge.spans(this.document.docSync()!, this.path),
				),
				plugins: [
					...this.plugins,
					syncPlugin({
						adapter: adapter,
						handle: this.document,
						path: this.path,
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
