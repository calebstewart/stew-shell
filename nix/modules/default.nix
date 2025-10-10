{stew-shell, ...}:
{lib, config, pkgs, ...}:
let
  cfg = config.stew-shell;

  newPkgs = {
    stew-shell = stew-shell.packages.${pkgs.system}.default;
  } // pkgs;
in {
  options.stew-shell = {
    enable = lib.mkEnableOption "stew-shell";
    package = lib.mkPackageOption newPkgs "stew-shell";
  };

  config = lib.mkIf cfg.enable {
    systemd.user.services.stew-shell = {
      Unit = {
        Description = "Desktop Shell User Interface";
      };

      Service = {
        Type = "simple";
        ExecStart = lib.getExe cfg.package;
        Restart = "on-failure";
      };

      Install.WantedBy = ["hyprland-session.target"];
    };
  };
}
