# Hyprland Desktop Shell
This code is open source for no good reason. It implements my custom desktop shell UI
using [AGS] and [Astal]. The shell is running on top of [GJS] under the hood. It
should work in any Hyprland environment, but I do not intend to support it for anyone
besides myself. Feel free to ask questions or rip the code, though. I'm hoping it will
be useful to someone besides myself.

![Example](https://github.com/user-attachments/assets/0b9f6389-a379-44c9-a9ec-e943ff3bfa40)

## Components

### Status Bar
A separate status bar will be created per-monitor. This includes hot-plugged monitors.
If a monitor is removed, the bar will be destroy. If a new monitor is connected, a new
bar will be created. Each bar has three sections: start, center, and end. The starting
section is on the left side. The end is on the right side. The center is well... in the
center...

#### Hyprland Active Client
![image](https://github.com/user-attachments/assets/3093d31b-bca7-4116-b355-26a6f991a887)

The starting section contains only a Hyprland Active Client widget. The widget displays
the most recent active client for the monitor, and it's associated icon. When the user
clicks on the application icon, it will toggle the application launcher popup. When
there are no clients in the workspace, the widget displays a `display` icon and prints
`Monitor {index}`.

#### Hyprland Workspace Switcher
![image](https://github.com/user-attachments/assets/01f0a3c3-e231-4782-9233-9ba4293a8faa)

The center section contains only the Hyprland Workspace Switcher. The switcher displays
the existing workspaces for the current monitor. Workspaces for a monitor are identified
by the monitor index. For monitor `X`, the valid workspaces are `X*10 + 1` to `X*10 + 9`.
The workspaces will be displayed as `1` through `9` visually. Clicking a workspace will
focus that workspace. This naming scheme aligns with the Hyprsplit plugin.

#### System Tray
![image](https://github.com/user-attachments/assets/0544a599-3009-447c-9759-8fc9633ffd3f)

The system tray is the set of widgets on the right side of the bar. It consists of a
number of `BarItem` widgets and the hamburger menu button. The bar is automatically
populated with tray items from applications implementing the [StatusNotifierItem]
protocol. Each item displays only an icon until hovered unless otherwise noted. If
clicked after hovering, the state will be locked until clicked again. The following
icons are also shown contextually:

1. Clock: this widget displays the time and timezone. It is locked visible by
   default, but can be collapsed with a click. The visibility syncs between all
   monitors.
2. Network (wireless/wired): this widget displays the active network/address of
   the wireless and wired networks.
3. Bluetooth: display the active device or the number of active devices, and the
   icon shows the powered state of the bluetooth adapter. The label will auto-reveal
   if a new device is connected or disconnected. Right-clicking shows the existing
   paired devices, and clicked on a device connects/disconnects that device.
4. Ember Mug: display the status of the connected ember mug. This requires the
   [Embermug] service to be installed and running. It will auto-reveal when the
   mug turns on, and has liquid. It will remain visible until the liquid is gone.
5. Privacy Indicators: a video and microphone privacy indicator will display and
   flash when there are PipeWire recording sessions active. If there is only one
   recording session, the name will be shown in the label. Otherwise, the number
   of recording sessions will be shown. Right-clicking on the icon will display
   the full name and description of all recording sessions. For *only the audio
   icon*, clicking the icon will toggle the mute status of the default microphone
   device.

### Application Launcher
![image](https://github.com/user-attachments/assets/3ed995b3-8ac5-472c-8ad2-b2c58d357561)

### Notification Daemon
![image](https://github.com/user-attachments/assets/bbf49a5a-dbe1-4d58-9184-c041ea0e2d7e)

### Quick Settings Menu
![image](https://github.com/user-attachments/assets/10b14fd1-4886-48d4-bf40-8b1e7348175d)

## Building
When developing, you can simply run `ags run .` within the repository to execute
the shell. It should function within any Hyprland environment. You will just have
an extra bar running.

You can bundle the application like any other `ags` application or use the Nix
flake. The flake exposes a package named `stew-shell` which provides a binary
of the same name to run the shell.

## Running
When bundled, the entrypoint will by start the shell for the first invocation, and
further invocations of `stew-shell` will send all arguments as an Astal request
to the shell. You can get a list of supported commands and their usage by running
the `help` command. You can also execute these commands using `ags request`, but
you either can only pass a single command name with no arguments, or have to pass
the command and arguments as a JSON array.

```sh
# The following assumes the shell is running; e.g. by doing:
stew-shell &
ags run . &

# Send the `help` command and format the output
stew-shell help
ags request help
ags request '["help"]'

# Show the application launcher
stew-shell toggle-launcher
ags request toggle-launcher
ags request '["toggle-launcher"]'
```

At the time of writing, this is the current help output:

```json
{
  "help": {
    "usage": "help",
    "description": "Show this help message"
  },
  "environ": {
    "usage": "environ",
    "description": "Return the current contents of the process environment as reported by GLib"
  },
  "toggle-settings-menu": {
    "usage": "toggle-settings-menu",
    "description": "Toggle the quick settings dash menu"
  },
  "toggle-launcher": {
    "usage": "toggle-launcher",
    "description": "Toggle the application launcher menu"
  },
  "lock": {
    "usage": "lock",
    "description": "Lock the session"
  },
  "unlock": {
    "usage": "unlock",
    "description": "Unlock the session"
  }
}
```

> [!CAUTION]
> The `unlock` command will be rejected unless the current instance name is `dev`.

## Organization
The project is organized into two primary parts: [components], and [request handlers].

### Request Handler
AGS supports sending "requests" to running instances with a single arbitrary
string argument. The application is able to handle the request, and return an
arbitrary JS object. [request/index.ts] implements a handler
which will match the incoming request with a named handler instance, and then
invoke the handler. Responses are JSON-serialized and returned while exceptions
are JSON-serialized in a consistent manner and also returned. This creates a nice
framework for implementing external request handlers.

Generally, to add a new handler, implement a class which complies with the
[RequestHandler] interface, and then import it, and place an instance of that
class in the `requestHandlers` list. There is a built-in `help` command which
returns an object containing the available commands, their usage, and descriptions
when invoked.

### Components
Components are the building blocks which make up the shell itself. The root component
is the main entrypoint for the AGS application, and is defined as the default export
of [components/index.ts]. In the context of the shell, the windows don't need to be
"stored" anywhere once they are created and shown. They will be tracked by GLib as
long as the window exists and is displayed. It is common for setup functions to
return the primary or root window, but that return value is often ignored.

If you need a popup window, which behaves similar to a context menu, you can use
the the [PopupWindow] class which wraps an `Astal.Window` with a second invisible
"closer" window. When the escape key is pressed or any button press is received
on the fullscreen, invisible "closer" window, the primary popup will be hidden.
This is used internally for things like the application launcher or the quick
settings window.

If you need windows to spawn for every monitor including future monitors, and be
destroyed during hot-plug of monitors, then you can use the [RegisterPerMonitorWindows]
function. This function will take in a `Map<Monitor, Widget>` and a widget constructor.
The map is used as a registery mapping each GDK monitor to the corresponding widget.
The constructor function is executed for each monitor. Initially, it is executed
and the registry filled per existing monitors in the `App`, then signals are
connected for `monitor-added` and `monitor-removed` to handle invokign the constructor
at the appropriate times. If you need to run code on a window when a monitor is
removed, you can use the `onDestroy` property of the window during construction.
The window is automatically destroy when it's associated monitor is removed.

## Assumptions
This is not a generic desktop shell UI, so there are some assumptions made based
on my own situation, and the fact that I can change the code if my situation
changes.

1. There are valid ethernet adapters (at least one).
2. There are valid wireless adapters (at least one).
3. There is a bluetooth adapter.
4. You have my [Embermug Service] installed and running.
5. You are using Hyprland as your compositor.

These are not generally speaking required. You could modify the code to disable
or remove the bar components that require certain devices. You could delete the
Ember Mug component completely. You could even write Sway-compatible workspaces
and active window components, and replace the Hyprland dependency. Go for it!
But I'm not going to support it. Sorry. :)

[AGS]: https://github.com/Aylur/ags
[Astal]: https://github.com/Aylur/astal
[GJS]: https://gjs.guide/
[components]: ./components
[components/index.ts]: components/index.ts
[request handlers]: ./request/
[request/index.ts]: ./request/index.ts
[RequestHandler]: ./request/request.ts
[PopupWindow]: ./components/popup/index.ts
[RegisterPerMonitorWindows]: ./components/per-monitor/index.ts
[Embermug Service]: https://github.com/calebstewart/go-embermug
[StatusNotifierItem]: https://www.freedesktop.org/wiki/Specifications/StatusNotifierItem/
