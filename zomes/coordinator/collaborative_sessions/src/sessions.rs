use hdk::prelude::*;

#[derive(Serialize, Deserialize, Debug)]
pub struct SendPresenceSignalInput {
    pub session_id: String,
    pub peers: Vec<AgentPubKey>,
}

#[hdk_extern]
pub fn send_presence_signal(input: SendPresenceSignalInput) -> ExternResult<()> {
    debug!(
        "Sending presence signal for session_id '{}' to {:?}",
        input.session_id, input.peers
    );
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
    debug!(
        "Sending session message for session_id '{}' to {:?}",
        input.session_message.session_id, input.peers
    );
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
    debug!(
        "Sending leave session signal for session_id '{}' to {:?}",
        input.session_id, input.peers
    );
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

impl RemoteSignal {
    fn session_id(&self) -> String {
        match self {
            Self::Presence { session_id } => session_id.clone(),
            Self::SessionMessage { session_id, .. } => session_id.clone(),
            Self::LeaveSession { session_id } => session_id.clone(),
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Signal {
    pub provenance: AgentPubKey,
    pub remote_signal: RemoteSignal,
}

#[hdk_extern]
pub fn recv_remote_signal(remote_signal: RemoteSignal) -> ExternResult<()> {
    let call_info = call_info()?;
    debug!(
        "Received session signal for session_id '{}'",
        remote_signal.session_id()
    );

    emit_signal(Signal {
        provenance: call_info.provenance,
        remote_signal,
    })
}
