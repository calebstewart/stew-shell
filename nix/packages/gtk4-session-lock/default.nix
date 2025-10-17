{
  glib,
  gtk4,
  cairo,
  gobject-introspection,
  gdk-pixbuf,
  graphene,
  pango,
  gtk4-layer-shell,
  pkg-config,
  rustPlatform,
  fetchFromGitHub,
  libadwaita,
}:
let
in
rustPlatform.buildRustPackage {
  pname = "gtk4-session-lock";
  version = "0.1.0";
  cargoPatches = [ ./0001-Add-Cargo.lock.patch ];
  cargoHash = "sha256-KZSxuDSstz7PF3MolrLcx9wcxMpcHie9Q3i5WtI2WOc=";
  doCheck = false;

  src = fetchFromGitHub {
    owner = "pentamassiv";
    repo = "gtk4-layer-shell-gir";
    rev = "9fb3a4b86f6816ffe3b9a4aa5bf0b6147abd1953";
    hash = "sha256-bDY3x82aPFYfBbtESTeAu0GiR8hkXEiooC/xRh5N3e8=";
  };

  nativeBuildInputs = [
    pkg-config
    gtk4
  ];

  buildInputs = [
    glib
    gtk4
    cairo
    gobject-introspection
    gdk-pixbuf
    graphene
    pango
    gtk4-layer-shell
    libadwaita
  ];
}
