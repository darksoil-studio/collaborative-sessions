use hdk::prelude::*;

#[derive(Serialize, Deserialize, Debug)]
pub struct SendPresenceSignalInput {
    pub session_id: String,
    pub peers: Vec<AgentPubKey>,
}

#[hdk_extern]
pub fn send_presence_signal(input: SendPresenceSignalInput) -> ExternResult<()> {
    send_remote_signal(
        RemoteSignal::Presence {
            session_id: input.session_id,
        },
        input.peers,
    )?;
    Ok(())
}

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
            session_id: input.session_message.session_id,
            message: input.session_message.message,
        },
        input.peers,
    )?;
    Ok(())
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SendLeaveSessionSignalInput {
    pub session_id: String,
    pub peers: Vec<AgentPubKey>,
}

#[hdk_extern]
pub fn send_leave_session_signal(input: SendLeaveSessionSignalInput) -> ExternResult<()> {
    send_remote_signal(
        RemoteSignal::LeaveSession {
            session_id: input.session_id,
        },
        input.peers,
    )?;
    Ok(())
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum RemoteSignal {
    Presence {
        session_id: String,
    },
    SessionMessage {
        session_id: String,
        message: SerializedBytes,
    },
    LeaveSession {
        session_id: String,
    },
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
