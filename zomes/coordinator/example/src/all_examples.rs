use example_integrity::*;
use hdk::prelude::*;

#[hdk_extern]
pub fn get_all_examples() -> ExternResult<Vec<Link>> {
    let path = Path::from("all_examples");
    get_links(
        GetLinksInputBuilder::try_new(path.path_entry_hash()?, LinkTypes::AllExamples)?.build(),
    )
}
