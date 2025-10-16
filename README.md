# Stew Shell
This repository implements a graphical deesktop shell for Wayland. This project is primarily aimed at
supporting my own personal computer, and so won't likely be useful to most people in general, but I
figure it might be helpful as a reference to someone.

The UI is implemented using [AGS]. More specifically, it is implemented in TypeScript and runs on
the Gnome JavaScript engine ([GJS]). I use Hyprland, and therefore the workspace and active
application widgets are specific to Hyprland, and won't work in other desktop environments. The
shell provides an application launcher, notification daemon, and quick settings panel as well.
The main bar is displayed on each monitor attached to the system dynamically.

## Components
The `/components` directory contains all of the UI components used by the application.

### Active Workspace
This component shows the last active client for the currently active workspace, and it's associated icon.
The component is shown in the far left side of the bar. The client icon and label are inside of a menu
button which when clicked will display the application launcher.

<img width="157" height="49" alt="image" src="https://github.com/user-attachments/assets/5996d0eb-83f5-45de-bc5a-34932aacc319" />

### Workspaces
This component displays all Hyprland workspaces for the assigned monitor. The component is displayed
in the center of the bar. Workspaces are assumed to be numeric, and the workspace number is displayed
modulo 10 meaning that you will see workspaces zero through nine. The workspace labels are buttons
which when clicked will focus the given workspace.

<img width="220" height="44" alt="image" src="https://github.com/user-attachments/assets/87dc915f-628a-46fe-90b3-b569246dd24e" />

### System Tray
This component is displayed on the far right of the bar, and holds system status information and
application icons registered with the DBus system tray service. When hovering over the system tray,
status icons expand to show more details (for example, the connected Wi-Fi network, bluetooth devices
or battery level). Clicking on the main status area will open the control panel popup. Clicking on
an application icon will open it's application menu, if one was provided by the application.

**Not Expanded**:

<img width="239" height="44" alt="image" src="https://github.com/user-attachments/assets/f0a097dc-ebf4-4815-96ec-3bbc75847cf2" />

**Expanded**:

<img width="605" height="54" alt="image" src="https://github.com/user-attachments/assets/b40384bb-b3e7-4b79-a87f-eb102a7e0451" />

### Launcher
The launcher lists applications with valid `.desktop` files, and allows you to launch one. You can open
the launcher at any time by clicking the active client button in the left side of the bar or running
the following command:

```sh
$ stew-shell popup launcher
```

<img width="655" height="568" alt="image" src="https://github.com/user-attachments/assets/70630455-55a2-42fc-9816-b889abbf75bb" />

### Control Panel
The control panel provides some quick settings, the option to lock, shut down or reboot the machine, and
a list of notifications. You can open the control panel by clicking on the tray in the far right of the bar
or by running the following command:

```sh
$ stew-shell popup control-panel
```

<img width="635" height="445" alt="image" src="https://github.com/user-attachments/assets/6627d8d5-3870-4a0d-85b9-f7cecca70c73" />
