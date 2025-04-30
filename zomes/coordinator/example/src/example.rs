use example_integrity::*;
use hdk::prelude::*;

#[hdk_extern]
pub fn create_example(example: Example) -> ExternResult<Record> {
    let example_hash = create_entry(&EntryTypes::Example(example.clone()))?;
    let record = get(example_hash.clone(), GetOptions::default())?.ok_or(wasm_error!(
        WasmErrorInner::Guest("Could not find the newly created Example".to_string())
    ))?;
    let path = Path::from("all_examples");
    create_link(
        path.path_entry_hash()?,
        example_hash.clone(),
        LinkTypes::AllExamples,
        (),
    )?;
    Ok(record)
}

#[hdk_extern]
pub fn get_latest_example(original_example_hash: ActionHash) -> ExternResult<Option<Record>> {
    let links = get_links(
        GetLinksInputBuilder::try_new(original_example_hash.clone(), LinkTypes::ExampleUpdates)?
            .build(),
    )?;
    let latest_link = links
        .into_iter()
        .max_by(|link_a, link_b| link_a.timestamp.cmp(&link_b.timestamp));
    let latest_example_hash = match latest_link {
        Some(link) => {
            link.target
                .clone()
                .into_action_hash()
                .ok_or(wasm_error!(WasmErrorInner::Guest(
                    "No action hash associated with link".to_string()
                )))?
        }
        None => original_example_hash.clone(),
    };
    get(latest_example_hash, GetOptions::default())
}

#[hdk_extern]
pub fn get_original_example(original_example_hash: ActionHash) -> ExternResult<Option<Record>> {
    let Some(details) = get_details(original_example_hash, GetOptions::default())? else {
        return Ok(None);
    };
    match details {
        Details::Record(details) => Ok(Some(details.record)),
        _ => Err(wasm_error!(WasmErrorInner::Guest(
            "Malformed get details response".to_string()
        ))),
    }
}

#[hdk_extern]
pub fn get_all_revisions_for_example(
    original_example_hash: ActionHash,
) -> ExternResult<Vec<Record>> {
    let Some(original_record) = get_original_example(original_example_hash.clone())? else {
        return Ok(vec![]);
    };
    let links = get_links(
        GetLinksInputBuilder::try_new(original_example_hash.clone(), LinkTypes::ExampleUpdates)?
            .build(),
    )?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|link| {
            Ok(GetInput::new(
                link.target
                    .into_action_hash()
                    .ok_or(wasm_error!(WasmErrorInner::Guest(
                        "No action hash associated with link".to_string()
                    )))?
                    .into(),
                GetOptions::default(),
            ))
        })
        .collect::<ExternResult<Vec<GetInput>>>()?;
    let records = HDK.with(|hdk| hdk.borrow().get(get_input))?;
    let mut records: Vec<Record> = records.into_iter().flatten().collect();
    records.insert(0, original_record);
    Ok(records)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateExampleInput {
    pub original_example_hash: ActionHash,
    pub previous_example_hash: ActionHash,
    pub updated_example: Example,
}

#[hdk_extern]
pub fn update_example(input: UpdateExampleInput) -> ExternResult<Record> {
    let updated_example_hash =
        update_entry(input.previous_example_hash.clone(), &input.updated_example)?;
    create_link(
        input.original_example_hash.clone(),
        updated_example_hash.clone(),
        LinkTypes::ExampleUpdates,
        (),
    )?;
    let record = get(updated_example_hash.clone(), GetOptions::default())?.ok_or(wasm_error!(
        WasmErrorInner::Guest("Could not find the newly updated Example".to_string())
    ))?;
    Ok(record)
}

#[hdk_extern]
pub fn delete_example(original_example_hash: ActionHash) -> ExternResult<ActionHash> {
    let path = Path::from("all_examples");
    let links = get_links(
        GetLinksInputBuilder::try_new(path.path_entry_hash()?, LinkTypes::AllExamples)?.build(),
    )?;
    for link in links {
        if let Some(hash) = link.target.into_action_hash() {
            if hash == original_example_hash {
                delete_link(link.create_link_hash)?;
            }
        }
    }
    delete_entry(original_example_hash)
}

#[hdk_extern]
pub fn get_all_deletes_for_example(
    original_example_hash: ActionHash,
) -> ExternResult<Option<Vec<SignedActionHashed>>> {
    let Some(details) = get_details(original_example_hash, GetOptions::default())? else {
        return Ok(None);
    };
    match details {
        Details::Entry(_) => Err(wasm_error!(WasmErrorInner::Guest(
            "Malformed details".into()
        ))),
        Details::Record(record_details) => Ok(Some(record_details.deletes)),
    }
}

#[hdk_extern]
pub fn get_oldest_delete_for_example(
    original_example_hash: ActionHash,
) -> ExternResult<Option<SignedActionHashed>> {
    let Some(mut deletes) = get_all_deletes_for_example(original_example_hash)? else {
        return Ok(None);
    };
    deletes.sort_by(|delete_a, delete_b| {
        delete_a
            .action()
            .timestamp()
            .cmp(&delete_b.action().timestamp())
    });
    Ok(deletes.first().cloned())
}
