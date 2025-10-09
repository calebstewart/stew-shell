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
    pkgs = nixpkgs.legacyPackages.${system};
    pname = "stew-shell";
    entry = "app.tsx";

    extraPackages = with pkgs; [
      libadwaita
      libsoup_3
      glib
    ] ++ (with astal.packages.${system}; [
      astal4
      battery
      powerprofiles
      hyprland
      network
      notifd
      apps
      bluetooth
      mpris
      wireplumber
      tray
      auth
      io
    ]);
  in {
    packages.${system}.default = pkgs.stdenv.mkDerivation {
      name = pname;
      meta.mainProgram = pname;
      src = ./.;

      nativeBuildInputs = with pkgs; [
        wrapGAppsHook
        gobject-introspection
        glib
        ags.packages.${system}.default
      ];

      buildInputs = extraPackages ++ [pkgs.gjs];

      installPhase = ''
        runHook preInstall

        mkdir -p $out/bin
        mkdir -p $out/share
        cp -r * $out/share
        ags bundle ${entry} $out/bin/${pname} -d "SRC='$out/share'"

        runHook postInstall
      '';
    };

    devShells.${system} = {
      default = pkgs.mkShell {
        buildInputs = [
          pkgs.glib
          (ags.packages.${system}.default.override {
            inherit extraPackages;
          })
        ];
      };
    };
  };
}
