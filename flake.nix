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

  outputs = {self, nixpkgs, ags, astal}:
  let
    system = "x86_64-linux";
    extraPackages = {
      ags = ags.packages.${system}.default;
      astal = astal.packages.${system};
    };

    callPackage = nixpkgs.lib.callPackageWith pkgs;
    pkgs = nixpkgs.legacyPackages.${system} // {
      ags = ags.packages.${system}.default;
      astal = astal.packages.${system};
      stew-shell = callPackage ./nix/packages/default.nix { };
      gtk4-session-lock = callPackage ./nix/packages/gtk4-session-lock { };
    };
  in {
    packages.${system} = rec {
      inherit (pkgs) stew-shell gtk4-session-lock;
      default = pkgs.stew-shell;
    };
  };
}
