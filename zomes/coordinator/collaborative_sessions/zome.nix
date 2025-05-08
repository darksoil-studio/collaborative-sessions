{ inputs, ... }:

{
  perSystem = { inputs', system, self', ... }: {
    packages.collaborative_sessions_coordinator =
      inputs.holochain-nix-builders.outputs.builders.${system}.rustZome {
        workspacePath = inputs.self.outPath;
        crateCargoToml = ./Cargo.toml;
      };

  };
}

