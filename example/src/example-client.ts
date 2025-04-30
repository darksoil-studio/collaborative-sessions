import { EntryRecord, ZomeClient } from '@darksoil-studio/holochain-utils';
import {
	ActionHash,
	AgentPubKey,
	AppClient,
	CreateLink,
	Delete,
	DeleteLink,
	EntryHash,
	Link,
	Record,
	SignedActionHashed,
} from '@holochain/client';

import { Example } from './types.js';
import { ExampleSignal } from './types.js';

export class ExampleClient extends ZomeClient<ExampleSignal> {
	constructor(
		public client: AppClient,
		public roleName: string,
		public zomeName = 'example',
	) {
		super(client, roleName, zomeName);
	}
	/** Example */

	async createExample(example: Example): Promise<EntryRecord<Example>> {
		const record: Record = await this.callZome('create_example', example);
		return new EntryRecord(record);
	}

	async getLatestExample(
		exampleHash: ActionHash,
	): Promise<EntryRecord<Example> | undefined> {
		const record: Record = await this.callZome(
			'get_latest_example',
			exampleHash,
		);
		return record ? new EntryRecord(record) : undefined;
	}

	async getOriginalExample(
		exampleHash: ActionHash,
	): Promise<EntryRecord<Example> | undefined> {
		const record: Record = await this.callZome(
			'get_original_example',
			exampleHash,
		);
		return record ? new EntryRecord(record) : undefined;
	}

	async getAllRevisionsForExample(
		exampleHash: ActionHash,
	): Promise<Array<EntryRecord<Example>>> {
		const records: Record[] = await this.callZome(
			'get_all_revisions_for_example',
			exampleHash,
		);
		return records.map(r => new EntryRecord(r));
	}

	async updateExample(
		originalExampleHash: ActionHash,
		previousExampleHash: ActionHash,
		updatedExample: Example,
	): Promise<EntryRecord<Example>> {
		const record: Record = await this.callZome('update_example', {
			original_example_hash: originalExampleHash,
			previous_example_hash: previousExampleHash,
			updated_example: updatedExample,
		});
		return new EntryRecord(record);
	}

	deleteExample(originalExampleHash: ActionHash): Promise<ActionHash> {
		return this.callZome('delete_example', originalExampleHash);
	}

	getAllDeletesForExample(
		originalExampleHash: ActionHash,
	): Promise<Array<SignedActionHashed<Delete>> | undefined> {
		return this.callZome('get_all_deletes_for_example', originalExampleHash);
	}

	getOldestDeleteForExample(
		originalExampleHash: ActionHash,
	): Promise<SignedActionHashed<Delete> | undefined> {
		return this.callZome('get_oldest_delete_for_example', originalExampleHash);
	}

	/** All Examples */

	async getAllExamples(): Promise<Array<Link>> {
		return this.callZome('get_all_examples', undefined);
	}
}
