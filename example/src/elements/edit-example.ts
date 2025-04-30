import {
  hashProperty,
  hashState,
  notifyError,
  onSubmit,
  sharedStyles,
  wrapPathInSvg,
} from "@darksoil-studio/holochain-elements";
import { SignalWatcher, toPromise } from "@darksoil-studio/holochain-signals";
import { EntryRecord } from "@darksoil-studio/holochain-utils";
import { ActionHash, AgentPubKey, EntryHash, Record } from "@holochain/client";
import { consume } from "@lit/context";
import { localized, msg } from "@lit/localize";
import { mdiAlertCircleOutline, mdiDelete } from "@mdi/js";
import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";

import SlAlert from "@shoelace-style/shoelace/dist/components/alert/alert.js";
import "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";
import "@shoelace-style/shoelace/dist/components/card/card.js";
import "@shoelace-style/shoelace/dist/components/alert/alert.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/textarea/textarea.js";

import "@shoelace-style/shoelace/dist/components/icon/icon.js";
import { exampleStoreContext } from "../context.js";
import { ExampleStore } from "../example-store.js";
import { Example } from "../types.js";

/**
 * @element edit-example
 * @fires example-updated: detail will contain { originalExampleHash, previousExampleHash, updatedExampleHash }
 */
@localized()
@customElement("edit-example")
export class EditExample extends SignalWatcher(LitElement) {
  /**
   * REQUIRED. The hash of the original `Create` action for this Example
   */
  @property(hashProperty("example-hash"))
  exampleHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: exampleStoreContext })
  exampleStore!: ExampleStore;

  /**
   * @internal
   */
  @state()
  committing = false;

  async firstUpdated() {
    const currentRecord = await toPromise(this.exampleStore.examples.get(this.exampleHash).latestVersion);
    setTimeout(() => {
      (this.shadowRoot?.getElementById("form") as HTMLFormElement).reset();
    });
  }

  async updateExample(currentRecord: EntryRecord<Example>, fields: Partial<Example>) {
    const example: Example = {
      text: fields.text!,
    };

    try {
      this.committing = true;
      const updateRecord = await this.exampleStore.client.updateExample(
        this.exampleHash,
        currentRecord.actionHash,
        example,
      );

      this.dispatchEvent(
        new CustomEvent("example-updated", {
          composed: true,
          bubbles: true,
          detail: {
            originalExampleHash: this.exampleHash,
            previousExampleHash: currentRecord.actionHash,
            updatedExampleHash: updateRecord.actionHash,
          },
        }),
      );
    } catch (e: unknown) {
      console.error(e);
      notifyError(msg("Error updating the example"));
    }

    this.committing = false;
  }

  renderEditForm(currentRecord: EntryRecord<Example>) {
    return html`
      <sl-card>

        <form
          id="form"
          class="column"
          style="flex: 1; gap: 16px;"
          ${onSubmit(fields => this.updateExample(currentRecord, fields))}
        >  
        <span class="title">${msg("Edit Example")}</span>

        <sl-textarea name="text" .label=${
      msg("Text")
    }  required .defaultValue=${currentRecord.entry.text}></sl-textarea>

          <sl-button
            type="submit"
            variant="primary"
            style="flex: 1;"
            .loading=${this.committing}
          >${msg("Save")}</sl-button>
        </form>
      </sl-card>`;
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
        return this.renderEditForm(example.value);
    }
  }

  static styles = [sharedStyles];
}
