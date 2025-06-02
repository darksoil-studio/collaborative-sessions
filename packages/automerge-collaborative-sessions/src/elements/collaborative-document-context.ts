import { next as Automerge } from '@automerge/automerge/slim';
import {
	CollaborativeSessionsClient,
	collaborativeSessionsClientContext,
} from '@darksoil-studio/collaborative-sessions-zome';
import { Signal } from '@darksoil-studio/holochain-signals';
import { AgentPubKey } from '@holochain/client';
import { consume, provide } from '@lit/context';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { CollaborativeDocument } from '../collaborative-document.js';
import { collaborativeDocumentContext } from '../context.js';
import { DocHandleChangePayload } from '../doc-handle.js';

/**
 * @element collaborative-document-context
 */
@customElement('collaborative-document-context')
export class CollaborativeDocumentContext extends LitElement {
	@consume({ context: collaborativeSessionsClientContext })
	@property({ type: Object })
	collaborativeSessionsClient!: CollaborativeSessionsClient;

	@property({ attribute: 'session-id' })
	sessionId!: string;

	@provide({ context: collaborativeDocumentContext })
	document!: CollaborativeDocument<unknown>;

	@property()
	initialDocument!: Automerge.Doc<unknown>;

	_acceptedCollaborators = new Signal.State<AgentPubKey[]>(
		this.acceptedCollaborators,
	);
	set acceptedCollaborators(collaborators: Array<AgentPubKey>) {
		this._acceptedCollaborators.set(collaborators);
	}
	get acceptedCollaborators() {
		return this._acceptedCollaborators ? this._acceptedCollaborators.get() : [];
	}

	connectedCallback() {
		super.connectedCallback();

		this.document = new CollaborativeDocument(
			this.collaborativeSessionsClient,
			this.sessionId,
			this._acceptedCollaborators,
			this.initialDocument,
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
