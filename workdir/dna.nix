{ inputs, ... }:

{
  perSystem = { inputs', self', lib, system, ... }: {
    packages.real_time_sessions_test_dna =
      inputs.holochain-nix-builders.outputs.builders.${system}.dna {
        dnaManifest = ./dna.yaml;
        zomes = {
          # Include here the zome packages for this DNA, e.g.:
          profiles_integrity =
            inputs'.profiles-zome.packages.profiles_integrity;
          profiles = inputs'.profiles-zome.packages.profiles;
          # This overrides all the "bundled" properties for the DNA manifest
          real_time_sessions_integrity =
            self'.packages.real_time_sessions_integrity;
          real_time_sessions = self'.packages.real_time_sessions;
          example_integrity = self'.packages.example_integrity;
          example = self'.packages.example;
        };
      };
  };
}

