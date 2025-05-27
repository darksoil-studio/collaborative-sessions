import { next as Automerge } from '@automerge/automerge/slim';
import {
	MappedSchemaSpec,
	SchemaAdapter,
	basicSchemaAdapter,
	pmDocFromSpans,
	syncPlugin,
} from '@automerge/prosemirror';
import { sharedStyles } from '@darksoil-studio/holochain-elements';
import { SignalWatcher } from '@darksoil-studio/holochain-signals';
import { LitElement, PropertyValues, css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { EditorState, Plugin, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { prosemirrorMenuStyles, prosemirrorStyles } from './styles.js';

@customElement('readonly-prosemirror')
export class ReadonlyProsemirror extends SignalWatcher(LitElement) {
	@property()
	plugins: Array<Plugin<unknown>> = [];

	@property()
	schemaSpec: MappedSchemaSpec | undefined;

	get schema() {
		return this.adapter.schema;
	}

	adapter!: SchemaAdapter;

	@property()
	path: string[] = ['text'];

	@property()
	document!: Automerge.Doc<unknown>;

	@property()
	styles: string[] = [];

	prosemirror!: EditorView;

	firstUpdated() {
		this.adapter = this.schemaSpec
			? new SchemaAdapter(this.schemaSpec)
			: basicSchemaAdapter;
		this.setupProsemirror();
	}

	updated(changed: PropertyValues) {
		super.updated(changed);
		if (changed.has('document')) {
			this.setupProsemirror();
		}
	}

	setupProsemirror() {
		if (this.prosemirror) {
			const div = this.shadowRoot?.querySelector('div');
			if (div) {
				this.shadowRoot?.removeChild(div);
			}
		}
		this.prosemirror = new EditorView(this.shadowRoot, {
			state: EditorState.create({
				doc: pmDocFromSpans(
					this.adapter,
					Automerge.spans(this.document, this.path),
				),
				plugins: [
					syncPlugin({
						adapter: this.adapter,
						handle: {
							change(fn) {},
							docSync: () => this.document,
							off(event, callback) {},
							on(event, callback) {},
						},
						path: this.path,
					}),
					...this.plugins,
				],
			}),
			dispatchTransaction: (tx: Transaction) => {
				this.prosemirror!.updateState(this.prosemirror!.state.apply(tx));
			},
			editable: () => false,
		});
	}

	render() {
		return html`${this.styles.map(
			s =>
				html`<style>
					${s}
				</style>`,
		)}`;
	}

	static styles = [
		css`
			:host {
				pointer-events: none;
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
