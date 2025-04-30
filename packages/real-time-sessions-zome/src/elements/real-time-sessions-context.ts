import { appClientContext } from '@darksoil-studio/holochain-elements';
import { AppClient } from '@holochain/client';
import { consume, provide } from '@lit/context';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { realTimeSessionsStoreContext } from '../context.js';
import { RealTimeSessionsClient } from '../real-time-sessions-client.js';
import { RealTimeSessionsStore } from '../real-time-sessions-store.js';

/**
 * @element real-time-sessions-context
 */
@customElement('real-time-sessions-context')
export class RealTimeSessionsContext extends LitElement {
	@consume({ context: appClientContext })
	private client!: AppClient;

	@provide({ context: realTimeSessionsStoreContext })
	@property({ type: Object })
	store!: RealTimeSessionsStore;

	@property()
	role!: string;

	@property()
	zome = 'real_time_sessions';

	connectedCallback() {
		super.connectedCallback();
		if (this.store) return;
		if (!this.role) {
			throw new Error(
				`<real-time-sessions-context> must have a role="YOUR_DNA_ROLE" property, eg: <real-time-sessions-context role="role1">`,
			);
		}
		if (!this.client) {
			throw new Error(`<real-time-sessions-context> must either:
        a) be placed inside <app-client-context>
          or 
        b) receive an AppClient property (eg. <real-time-sessions-context .client=\${client}>) 
          or 
        c) receive a store property (eg. <real-time-sessions-context .store=\${store}>)
      `);
		}

		this.store = new RealTimeSessionsStore(
			new RealTimeSessionsClient(this.client, this.role, this.zome),
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
