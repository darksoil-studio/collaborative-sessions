import { Message } from '@automerge/automerge-repo';
import { DocumentStore } from '@darksoil-studio/automerge-collaborative-sessions';
import {
	hashProperty,
	hashState,
	notifyError,
	onSubmit,
	sharedStyles,
	wrapPathInSvg,
} from '@darksoil-studio/holochain-elements';
import '@darksoil-studio/holochain-elements/dist/elements/display-error.js';
import {
	Signal,
	SignalWatcher,
	toPromise,
} from '@darksoil-studio/holochain-signals';
import { EntryRecord } from '@darksoil-studio/holochain-utils';
import {
	ProfilesStore,
	profilesStoreContext,
} from '@darksoil-studio/profiles-zome';
import {
	ActionHash,
	AgentPubKey,
	DnaHash,
	EntryHash,
	Record,
} from '@holochain/client';
import { consume } from '@lit/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiDelete } from '@mdi/js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import { LitElement, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { exampleStoreContext } from '../context.js';
import { ExampleStore } from '../example-store.js';
import { Example } from '../types.js';

/**
 * @element create-example
 * @fires example-created: detail will contain { exampleHash }
 */
@localized()
@customElement('create-example')
export class CreateExample extends SignalWatcher(LitElement) {
	/**
	 * @internal
	 */
	@consume({ context: exampleStoreContext, subscribe: true })
	exampleStore!: ExampleStore;

	/**
	 * @internal
	 */
	@state()
	committing = false;

	/**
	 * @internal
	 */
	@query('#create-form')
	form!: HTMLFormElement;

	async createExample(fields: Partial<Example>) {
		const example: Example = {
			text: fields.text!,
		};

		try {
			this.committing = true;
			const record: EntryRecord<Example> =
				await this.exampleStore.client.createExample(example);

			this.dispatchEvent(
				new CustomEvent('example-created', {
					composed: true,
					bubbles: true,
					detail: {
						exampleHash: record.actionHash,
					},
				}),
			);

			this.form.reset();
		} catch (e: unknown) {
			console.error(e);
			notifyError(msg('Error creating the example'));
		}
		this.committing = false;
	}

	render() {
		return html` <sl-card style="flex: 1;">
			<form
				id="create-form"
				class="column"
				style="flex: 1; gap: 16px;"
				${onSubmit(fields => this.createExample(fields))}
			>
				<span class="title">${msg('Create Example')}</span>

				<sl-textarea name="text" .label=${msg('Text')}></sl-textarea>

				<sl-button variant="primary" type="submit" .loading=${this.committing}
					>${msg('Create Example')}</sl-button
				>
			</form>
		</sl-card>`;
	}

	static styles = [sharedStyles];
}
