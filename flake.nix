{
  description = "Template for Holochain app development";

  inputs = {
    holonix.url = "github:holochain/holonix/main-0.5";

    nixpkgs.follows = "holonix/nixpkgs";
    flake-parts.follows = "holonix/flake-parts";

    holochain-nix-builders.url =
      "github:darksoil-studio/holochain-nix-builders/main-0.5";
    scaffolding.url = "github:darksoil-studio/scaffolding/main-0.5";
    playground.url = "github:darksoil-studio/holochain-playground/main-0.5";
    p2p-shipyard.url = "github:darksoil-studio/p2p-shipyard/main-0.5";

    profiles-zome.url = "github:darksoil-studio/profiles-zome/main-0.5";
  };

  nixConfig = {
    extra-substituters = [
      "https://holochain-ci.cachix.org"
      "https://darksoil-studio.cachix.org"
    ];
    extra-trusted-public-keys = [
      "holochain-ci.cachix.org-1:5IUSkZc0aoRS53rfkvH9Kid40NpyjwCMCzwRTXy+QN8="
      "darksoil-studio.cachix.org-1:UEi+aujy44s41XL/pscLw37KEVpTEIn8N/kn7jO8rkc="
    ];
  };

  outputs = inputs:
    inputs.flake-parts.lib.mkFlake { inherit inputs; } {
      imports = [
        ./zomes/coordinator/collaborative_sessions/zome.nix
        ./zomes/integrity/example/zome.nix
        ./zomes/coordinator/example/zome.nix
        # Just for testing purposes
        ./workdir/dna.nix
        ./workdir/happ.nix
      ];

      systems = builtins.attrNames inputs.holonix.devShells;
      perSystem = { inputs', config, pkgs, system, ... }: {
        devShells.default = pkgs.mkShell {
          inputsFrom = [
            inputs'.scaffolding.devShells.synchronized-pnpm
            inputs'.holonix.devShells.default
          ];

          packages = [
            inputs'.holochain-nix-builders.packages.holochain
            inputs'.scaffolding.packages.hc-scaffold-zome
            inputs'.p2p-shipyard.packages.hc-pilot
            inputs'.playground.packages.hc-playground
          ];
        };
        devShells.npm-ci = inputs'.scaffolding.devShells.synchronized-pnpm;

        packages.scaffold = pkgs.symlinkJoin {
          name = "scaffold-remote-zome";
          paths = [ inputs'.scaffolding.packages.scaffold-remote-zome ];
          buildInputs = [ pkgs.makeWrapper ];
          postBuild = ''
            wrapProgram $out/bin/scaffold-remote-zome \
              --add-flags "collaborative-sessions-zome \
                --coordinator-zome-name collaborative_sessions_coordinator \
                --remote-zome-git-url github:darksoil-studio/collaborative-sessions-zome \
                --remote-npm-package-name @darksoil-studio/collaborative-sessions-zome \
                --remote-zome-git-branch main-0.5 \
                --context-element collaborative-sessions-context \
                --context-element-import @darksoil-studio/collaborative-sessions-zome/dist/elements/collaborative-sessions-context.js" 
          '';
        };
      };
    };
}
