import { appClientContext } from '@darksoil-studio/holochain-elements';
import { AppClient } from '@holochain/client';
import { consume, provide } from '@lit/context';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { ExampleStoreContext } from '../context.js';
import { ExampleClient } from '../example-client.js';
import { ExampleStore } from '../example-store.js';

/**
 * @element example-context
 */
@customElement('example-context')
export class ExampleContext extends LitElement {
	@consume({ context: appClientContext })
	private client!: AppClient;

	@provide({ context: ExampleStoreContext })
	@property({ type: Object })
	store!: ExampleStore;

	@property()
	role!: string;

	@property()
	zome = 'real_time_sessions';

	connectedCallback() {
		super.connectedCallback();
		if (this.store) return;
		if (!this.role) {
			throw new Error(
				`<example-context> must have a role="YOUR_DNA_ROLE" property, eg: <example-context role="role1">`,
			);
		}
		if (!this.client) {
			throw new Error(`<example-context> must either:
        a) be placed inside <app-client-context>
          or 
        b) receive an AppClient property (eg. <example-context .client=\${client}>) 
          or 
        c) receive a store property (eg. <example-context .store=\${store}>)
      `);
		}

		this.store = new ExampleStore(
			new ExampleClient(this.client, this.role, this.zome),
		);
	}

	render() {
		return html`<slot></slot>`;
	}

	static styles = css`
		:host {
			display: contents;
		}
	`;
}
