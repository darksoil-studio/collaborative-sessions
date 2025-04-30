import { hashProperty, sharedStyles, wrapPathInSvg } from "@darksoil-studio/holochain-elements";
import { SignalWatcher } from "@darksoil-studio/holochain-signals";
import { ActionHash, AgentPubKey, EntryHash, Record } from "@holochain/client";
import { consume } from "@lit/context";
import { localized, msg } from "@lit/localize";
import { mdiInformationOutline } from "@mdi/js";
import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import "@darksoil-studio/holochain-elements/dist/elements/display-error.js";
import "@shoelace-style/shoelace/dist/components/spinner/spinner.js";
import "@shoelace-style/shoelace/dist/components/icon/icon.js";

import "./example-summary.js";
import { exampleStoreContext } from "../context.js";
import { ExampleStore } from "../example-store.js";

/**
 * @element all-examples
 */
@localized()
@customElement("all-examples")
export class AllExamples extends SignalWatcher(LitElement) {
  /**
   * @internal
   */
  @consume({ context: exampleStoreContext, subscribe: true })
  exampleStore!: ExampleStore;

  renderList(hashes: Array<ActionHash>) {
    if (hashes.length === 0) {
      return html` <div class="column placeholder center-content" style="gap: 8px; flex: 1">
        <sl-icon
          .src=${wrapPathInSvg(mdiInformationOutline)}
          style="font-size: 64px;"
          ></sl-icon
        >
        <span style="text-align: center">${msg("No examples found.")}</span>
      </div>`;
    }

    return html`
      <div class="column" style="gap: 8px; flex: 1">
        ${hashes.map(hash => html`<example-summary .exampleHash=${hash}></example-summary>`)}
      </div>
    `;
  }

  render() {
    const map = this.exampleStore.allExamples.get();

    switch (map.status) {
      case "pending":
        return html`<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;">
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case "error":
        return html`<display-error
          .headline=${msg("Error fetching the examples")}
          .error=${map.error}
        ></display-error>`;
      case "completed":
        return this.renderList(Array.from(map.value.keys()));
    }
  }

  static styles = [sharedStyles];
}
