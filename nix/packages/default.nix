{
  wrapGAppsHook,
  gobject-introspection,
  glib,
  gjs,
  gtk4-session-lock,
  gtk4-layer-shell,
  libadwaita,
  libsoup_3,
  astal,
  ags,
  stdenv,
  lib,
}: let
  pname = "stew-shell";
  entry = "app.tsx";

  extraPackages = [
    gtk4-session-lock
    gtk4-layer-shell
    libadwaita
    libsoup_3
    glib
  ] ++ (with astal; [
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

  agsOverride = ags.override {
    inherit extraPackages;
  };
in stdenv.mkDerivation {
  name = pname;
  version = "0.1.0";
  src = ./../..;

  nativeBuildInputs = [
    wrapGAppsHook
    gobject-introspection
    glib
    agsOverride
  ];

  buildInputs = [gjs] ++ extraPackages;

  installPhase = ''
    runHook preInstall

    mkdir -p $out/bin
    mkdir -p $out/share
    cp -r * $out/share
    ags bundle ${entry} $out/bin/${pname} -d "SRC='$out/share'"

    wrapProgram $out/bin/${pname} \
      --prefix PATH : ${lib.makeBinPath extraPackages}

    runHook postInstall
  '';

  meta = {
    mainProgram = pname;
  };
}
