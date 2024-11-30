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
of [components/index.ts]. There, we setup any global windows that are necessary, and
also connect signal handlers for creating windows specific to monitors.

If you are adding a new global component (e.g. a popup window), then it will be
created in the `Setup()` function. It can then be toggled as needed by other
components (or through a request handler).

If you are adding a component which should exist for each monitor, then you will
need to instantiate it twice. The first time is in the initialization loop over
`App.get_monitors()` within `Setup()`. This creates the initial windows for
monitors that exist during initialization. Next, you'll need to create the
window again within the `monitor-added` signal handler. Lastly, you'll need
to track the window's existence somewhere, and destroy it on `monitor-removed`.
For the status bar, this is done using a simple `Map<Monitor, Widget>` variable.

[AGS]: https://github.com/Aylur/ags
[Astal]: https://github.com/Aylur/astal
[GJS]: https://gjs.guide/
[components]: ./components
[components/index.ts]: components/index.ts
[request handlers]: ./request/
[request/index.ts]: ./request/index.ts
[RequestHandler]: ./request/request.ts
