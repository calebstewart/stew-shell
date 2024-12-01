{
  description = "Stew Shell - Custom Desktop Shell for Hyprland using AGS/Astal";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";

    ags = {
      url = "github:aylur/ags";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nixpkgs,
    ags,
  }: let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};
  in {
    packages.${system} = {
      default = ags.lib.bundle {
        inherit pkgs;
        src = ./.;
        name = "stew-shell";
        entry = "app.ts";

        # additional libraries and executables to add to gjs' runtime
        extraPackages = [
          ags.packages.${system}.battery
          ags.packages.${system}.hyprland
          ags.packages.${system}.network
          ags.packages.${system}.notifd
          ags.packages.${system}.apps
          ags.packages.${system}.bluetooth
          ags.packages.${system}.mpris
          ags.packages.${system}.wireplumber
          ags.packages.${system}.tray
          ags.packages.${system}.auth
          pkgs.gtk-session-lock.dev
          # pkgs.fzf
        ];
      };
    };

    devShells.${system} = {
      default = pkgs.mkShell {
        buildInputs = (with pkgs; [
          blueprint-compiler
          gtk4
          gtk4-layer-shell
          gobject-introspection
          gobject-introspection-unwrapped
        ]) ++ [
          # includes all Astal libraries
          # ags.packages.${system}.agsFull

          # includes astal3 astal4 astal-io by default
          (ags.packages.${system}.default.override {
            extraPackages = [
              # cherry pick packages
              ags.packages.${system}.battery
              ags.packages.${system}.hyprland
              ags.packages.${system}.network
              ags.packages.${system}.notifd
              ags.packages.${system}.apps
              ags.packages.${system}.bluetooth
              ags.packages.${system}.mpris
              ags.packages.${system}.wireplumber
              ags.packages.${system}.tray
              ags.packages.${system}.auth
              pkgs.gtk-session-lock.dev
            ];
          })
        ];
      };
    };
  };
}
