import { appClientContext } from '@darksoil-studio/holochain-elements';
import { AppClient } from '@holochain/client';
import { consume, provide } from '@lit/context';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { CollaborativeSessionsClient } from '../collaborative-sessions-client.js';
import { collaborativeSessionsClientContext } from '../context.js';

/**
 * @element collaborative-sessions-context
 */
@customElement('collaborative-sessions-context')
export class ExampleContext extends LitElement {
	@consume({ context: appClientContext })
	private client!: AppClient;

	@provide({ context: collaborativeSessionsClientContext })
	@property({ type: Object })
	collaborativeSessionsClient!: CollaborativeSessionsClient;

	@property()
	role!: string;

	@property()
	zome = 'collaborative_sessions';

	connectedCallback() {
		super.connectedCallback();
		if (this.collaborativeSessionsClient) return;
		if (!this.role) {
			throw new Error(
				`<collaborative-sessions-context> must have a role="YOUR_DNA_ROLE" property, eg: <collaborative-sessions-context role="role1">`,
			);
		}
		if (!this.client) {
			throw new Error(`<collaborative-sessions-context> must either:
        a) be placed inside <app-client-context>
          or 
        b) receive an AppClient property (eg. <collaborative-sessions-context .client=\${client}>) 
          or 
        c) receive a store property (eg. <collaborative-sessions-context .store=\${store}>)
      `);
		}

		this.collaborativeSessionsClient = new CollaborativeSessionsClient(
			this.client,
			this.role,
			this.zome,
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
