{
  description = "Stew Shell - Graphical Shell for StewOS";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";

    astal = {
      url = "github:aylur/astal";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    ags = {
      url = "github:aylur/ags";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.astal.follows = "astal";
    };
  };

  outputs = {self, nixpkgs, ags, astal}@rawInputs:
  let
    supportedSystems = ["x86_64-linux" "aarch64-linux"];
    forAllSystems = nixpkgs.lib.genAttrs supportedSystems;
    pkgsForSystem = system: (import nixpkgs {
      inherit system;
    });

    inputs = rawInputs // {
      stew-shell = self;
    };
  in {
    packages = forAllSystems (system: let
      callPackage = nixpkgs.lib.callPackageWith pkgs;
      pkgs = (pkgsForSystem system) // {
        ags = ags.packages.${system}.default;
        astal = astal.packages.${system};
        stew-shell = callPackage ./nix/packages/default.nix { };
        gtk4-session-lock = callPackage ./nix/packages/gtk4-session-lock { };
      };
    in {
      inherit (pkgs) stew-shell gtk4-session-lock;
      default = pkgs.stew-shell;
    });

    homeModules = {
      default = import ./nix/modules/default.nix inputs;
    };
  };
}
