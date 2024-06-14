{
  inputs,
  pkgs,
  devenv,
}: let
  local =
    rec {
    }
    // builtins.fromJSON (builtins.readFile ./defaults.json);
in
  devenv.lib.mkShell {
    inherit inputs pkgs;
    modules = [
      ({
        inputs,
        pkgs,
        config,
        ...
      }: {
        # This is your devenv configuration
        packages = [
          pkgs.nodejs-18_x
          pkgs.nodePackages.bun
        ];


      })
    ];
  }
