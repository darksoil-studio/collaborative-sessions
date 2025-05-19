import { next as Automerge } from '@automerge/automerge';
import {
	MappedSchemaSpec,
	SchemaAdapter,
	basicSchemaAdapter,
	pmDocFromSpans,
	syncPlugin,
} from '@automerge/prosemirror';
import {
	CollaborativeDocument,
	collaborativeDocumentContext,
} from '@darksoil-studio/automerge-collaborative-sessions';
import {
	CollaborativeSessionsClient,
	collaborativeSessionsClientContext,
} from '@darksoil-studio/collaborative-sessions-zome';
import { sharedStyles } from '@darksoil-studio/holochain-elements';
import { SignalWatcher } from '@darksoil-studio/holochain-signals';
import { consume } from '@lit/context';
import { LitElement, css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { EditorState, Plugin, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import placeholder from '../placeholder.js';
import { prosemirrorMenuStyles, prosemirrorStyles } from './styles.js';

@customElement('collaborative-prosemirror')
export class CollaborativeProsemirror extends SignalWatcher(LitElement) {
	@property()
	value!: string;

	@property()
	plugins: Array<Plugin<unknown>> = [];

	@property()
	schema: MappedSchemaSpec | undefined;

	@property()
	path: string[] = ['text'];

	@property()
	placeholder: string | undefined;

	@consume({ context: collaborativeSessionsClientContext })
	client!: CollaborativeSessionsClient;

	@query('#editor')
	el!: HTMLElement;

	prosemirror!: EditorView;

	@consume({ context: collaborativeDocumentContext })
	@property()
	public document!: CollaborativeDocument<unknown>;

	firstUpdated() {
		const adapter = this.schema
			? new SchemaAdapter(this.schema)
			: basicSchemaAdapter;

		const plugins = [
			...this.plugins,
			syncPlugin({
				adapter: adapter,
				handle: this.document,
				path: this.path,
			}),
		];
		if (this.placeholder) plugins.push(placeholder(this.placeholder));
		console.log(plugins);

		this.prosemirror = new EditorView(this.shadowRoot, {
			state: EditorState.create({
				doc: pmDocFromSpans(
					adapter,
					Automerge.spans(this.document.docSync()!, this.path),
				),
				plugins,
			}),
			dispatchTransaction: (tx: Transaction) => {
				this.prosemirror!.updateState(this.prosemirror!.state.apply(tx));
			},
		});
	}

	render() {
		return html``;
	}

	static styles = [
		css`
			:host {
			}
			#editor {
				min-height: 100%;
			}
			.ProseMirror {
				min-height: 100%;
			}

			.ProseMirror[data-placeholder]::before {
				position: absolute;
				content: attr(data-placeholder);
				pointer-events: none;
				color: var(--sl-color-gray-700);
			}

			[contenteditable]:active,
			[contenteditable]:focus {
				border: none;
				outline: none;
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
