use hdk::prelude::*;
use real_time_sessions_integrity::*;

#[derive(Serialize, Deserialize, Debug)]
pub struct SessionMessage {
    pub session_id: String,
    pub message: SerializedBytes,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SendSessionMessageInput {
    pub session_message: SessionMessage,
    pub peers: Vec<AgentPubKey>,
}

#[hdk_extern]
pub fn send_session_message(input: SendSessionMessageInput) -> ExternResult<()> {
    send_remote_signal(
        RemoteSignal::SessionMessage {
            session_message: input.session_message,
        },
        input.peers,
    )?;
    Ok(())
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum RemoteSignal {
    SessionMessage { session_message: SessionMessage },
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Signal {
    pub provenance: AgentPubKey,
    pub remote_signal: RemoteSignal,
}

#[hdk_extern]
pub fn recv_remote_signal(remote_signal: RemoteSignal) -> ExternResult<()> {
    let call_info = call_info()?;

    emit_signal(Signal {
        provenance: call_info.provenance,
        remote_signal,
    })
}
