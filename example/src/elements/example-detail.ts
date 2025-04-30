import { hashProperty, notifyError, sharedStyles, wrapPathInSvg } from "@darksoil-studio/holochain-elements";
import { SignalWatcher } from "@darksoil-studio/holochain-signals";
import { EntryRecord } from "@darksoil-studio/holochain-utils";
import { ActionHash, EntryHash, Record } from "@holochain/client";
import { consume } from "@lit/context";
import { localized, msg } from "@lit/localize";
import { mdiAlertCircleOutline, mdiDelete, mdiPencil } from "@mdi/js";
import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import "@shoelace-style/shoelace/dist/components/alert/alert.js";
import "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";
import "@darksoil-studio/holochain-elements/dist/elements/display-error.js";
import "@shoelace-style/shoelace/dist/components/card/card.js";
import "@shoelace-style/shoelace/dist/components/spinner/spinner.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";

import SlAlert from "@shoelace-style/shoelace/dist/components/alert/alert.js";
import { exampleStoreContext } from "../context.js";
import { ExampleStore } from "../example-store.js";
import { Example } from "../types.js";

/**
 * @element example-detail
 * @fires edit-clicked: fired when the user clicks the edit icon button
 * @fires example-deleted: detail will contain { exampleHash }
 */
@localized()
@customElement("example-detail")
export class ExampleDetail extends SignalWatcher(LitElement) {
  /**
   * REQUIRED. The hash of the Example to show
   */
  @property(hashProperty("example-hash"))
  exampleHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: exampleStoreContext, subscribe: true })
  exampleStore!: ExampleStore;

  async deleteExample() {
    try {
      await this.exampleStore.client.deleteExample(this.exampleHash);

      this.dispatchEvent(
        new CustomEvent("example-deleted", {
          bubbles: true,
          composed: true,
          detail: {
            exampleHash: this.exampleHash,
          },
        }),
      );
    } catch (e: unknown) {
      console.error(e);
      notifyError(msg("Error deleting the example"));
    }
  }

  renderDetail(entryRecord: EntryRecord<Example>) {
    return html`
      <sl-card style="flex: 1">
        <div class="column" style="gap: 16px; flex: 1;">
          <div class="row" style="gap: 8px">
            <span style="font-size: 18px; flex: 1;">${msg("Example")}</span>

            <sl-icon-button .src=${wrapPathInSvg(mdiPencil)} @click=${() =>
      this.dispatchEvent(
        new CustomEvent("edit-clicked", {
          bubbles: true,
          composed: true,
        }),
      )}></sl-icon-button>
            <sl-icon-button .src=${wrapPathInSvg(mdiDelete)} @click=${() => this.deleteExample()}></sl-icon-button>
          </div>

          <div class="column" style="gap: 8px;">
	        <span><strong>${msg("Text")}</strong></span>
 	        <span style="white-space: pre-line">${entryRecord.entry.text}</span>
	  </div>

      </div>
      </sl-card>
    `;
  }

  render() {
    const example = this.exampleStore.examples.get(this.exampleHash).latestVersion.get();

    switch (example.status) {
      case "pending":
        return html`<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case "error":
        return html`<display-error
          .headline=${msg("Error fetching the example")}
          .error=${example.error}
        ></display-error>`;
      case "completed":
        return this.renderDetail(example.value);
    }
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
