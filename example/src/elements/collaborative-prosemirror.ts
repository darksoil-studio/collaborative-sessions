import { next as Automerge } from '@automerge/automerge';
import {
	basicSchemaAdapter,
	pmDocFromSpans,
	syncPlugin,
} from '@automerge/prosemirror';
import '@darksoil-studio/automerge-real-time-sessions';
import { DocumentStore } from '@darksoil-studio/automerge-real-time-sessions';
import { sharedStyles } from '@darksoil-studio/holochain-elements';
import {
	Signal,
	SignalWatcher,
	joinAsyncMap,
	toPromise,
} from '@darksoil-studio/holochain-signals';
import { mapValues } from '@darksoil-studio/holochain-utils';
import {
	ProfilesStore,
	profilesStoreContext,
} from '@darksoil-studio/profiles-zome';
import {
	RealTimeSessionsClient,
	SessionStore,
} from '@darksoil-studio/real-time-sessions-zome';
import {
	AgentPubKey,
	decodeHashFromBase64,
	encodeHashToBase64,
} from '@holochain/client';
import { consume } from '@lit/context';
import { LitElement, css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { exampleSetup } from 'prosemirror-example-setup';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { prosemirrorMenuStyles, prosemirrorStyles } from './prosemirror.js';

@customElement('collaborative-prosemirror')
export class CollaborativeProsemirror extends SignalWatcher(LitElement) {
	@property()
	sessionId!: string;

	@property({ attribute: 'value', type: String })
	value!: string;

	@query('#editor')
	el!: HTMLElement;

	prosemirror!: EditorView;

	@consume({ context: profilesStoreContext, subscribe: true })
	profilesStore!: ProfilesStore;

	async firstUpdated() {
		const allAgents = new Signal.Computed<AgentPubKey[]>(() => {
			const allProfiles = this.profilesStore.allProfiles.get();
			if (allProfiles.status !== 'completed') return [];

			const originals = joinAsyncMap(
				mapValues(allProfiles.value, v => v.original.get()),
			);
			if (originals.status !== 'completed') return [];

			const agents = Array.from(originals.value.values()).map(
				r => r.action.author,
			);

			return agents;
		});

		const adapter = basicSchemaAdapter;
		const initialValue = Automerge.from({
			text: this.value || '',
		});

		const documentStore = new DocumentStore<{ text: string }>(
			new RealTimeSessionsClient(
				this.profilesStore.client.client,
				this.profilesStore.client.roleName,
			),
			this.sessionId,
			allAgents,
			initialValue,
		);

		this.prosemirror = new EditorView(this.el, {
			state: EditorState.create({
				doc: pmDocFromSpans(
					adapter,
					Automerge.spans(documentStore.docSync()!, ['text']),
				),
				plugins: [
					...exampleSetup({ schema: adapter.schema }),
					syncPlugin({ adapter, handle: documentStore, path: ['text'] }),
				],
			}),
			dispatchTransaction: (tx: Transaction) => {
				this.prosemirror!.updateState(this.prosemirror!.state.apply(tx));
			},
		});
	}

	render() {
		return html`<div id="editor" style="flex: 1"></div>`;
	}

	static styles = [
		css`
			:host {
				display: flex;
			}
		`,
		prosemirrorStyles,
		prosemirrorMenuStyles,
		sharedStyles,
	];
}
