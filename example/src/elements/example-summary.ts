import { next as A } from '@automerge/automerge';
import {
	DocHandle,
	basicSchemaAdapter,
	pmDocFromSpans,
	syncPlugin,
} from '@automerge/prosemirror';
import {
	hashProperty,
	sharedStyles,
} from '@darksoil-studio/holochain-elements';
import '@darksoil-studio/holochain-elements/dist/elements/display-error.js';
import { SignalWatcher } from '@darksoil-studio/holochain-signals';
import { EntryRecord } from '@darksoil-studio/holochain-utils';
import {
	ActionHash,
	EntryHash,
	Record,
	encodeHashToBase64,
} from '@holochain/client';
import { consume } from '@lit/context';
import { localized, msg } from '@lit/localize';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ref } from 'lit/directives/ref.js';
import { exampleSetup } from 'prosemirror-example-setup';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { exampleStoreContext } from '../context.js';
import { ExampleStore } from '../example-store.js';
import { Example } from '../types.js';

/**
 * @element example-summary
 * @fires example-selected: detail will contain { exampleHash }
 */
@localized()
@customElement('example-summary')
export class ExampleSummary extends SignalWatcher(LitElement) {
	/**
	 * REQUIRED. The hash of the Example to show
	 */
	@property(hashProperty('example-hash'))
	exampleHash!: ActionHash;

	/**
	 * @internal
	 */
	@consume({ context: exampleStoreContext, subscribe: true })
	exampleStore!: ExampleStore;

	prosemirror: EditorView | undefined;

	renderSummary(entryRecord: EntryRecord<Example>) {
		return html`
			<div
				${ref(el => {
					if (!el || !this.prosemirror) return;

					const adapter = basicSchemaAdapter;

					const handle: DocHandle<{ text: string }> =
						buildRealTimeSessionDocHandle(encodeHashToBase64(this.exampleHash));

					this.prosemirror = new EditorView(el, {
						state: EditorState.create({
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							doc: pmDocFromSpans(
								adapter,
								A.spans(handle.docSync()!, ['text']),
							),
							plugins: [
								...exampleSetup({ schema: adapter.schema }),
								syncPlugin({ adapter, handle, path: ['text'] }),
							],
						}),
						dispatchTransaction: (tx: Transaction) => {
							this.prosemirror!.updateState(this.prosemirror!.state.apply(tx));
						},
					});
				})}
			></div>
		`;
	}

	renderExample() {
		const example = this.exampleStore.examples
			.get(this.exampleHash)
			.latestVersion.get();

		switch (example.status) {
			case 'pending':
				return html`<div
					style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;"
				>
					<sl-spinner style="font-size: 2rem;"></sl-spinner>
				</div>`;
			case 'error':
				return html`<display-error
					.headline=${msg('Error fetching the example')}
					.error=${example.error}
				></display-error>`;
			case 'completed':
				return this.renderSummary(example.value);
		}
	}

	render() {
		return html`<sl-card
			style="flex: 1; cursor: grab;"
			@click=${() =>
				this.dispatchEvent(
					new CustomEvent('example-selected', {
						composed: true,
						bubbles: true,
						detail: {
							exampleHash: this.exampleHash,
						},
					}),
				)}
		>
			${this.renderExample()}
		</sl-card>`;
	}

	static styles = [
		sharedStyles,
		css`
			:host {
				display: flex;
			}
		`,
	];
}
