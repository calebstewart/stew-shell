# Caleb Stewart's Wayland Desktop Shell
This code is open source for no good reason. It implements my custom desktop shell UI
using [AGS] and [Astal]. The shell is running on top of [GJS] under the hood. It
should work in any Hyprland environment, but I do not intend to support it for anyone
besides myself. Feel free to ask questions or rip the code, though. I'm hoping it will
be useful to someone besides myself.

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
