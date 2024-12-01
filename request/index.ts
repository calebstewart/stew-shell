import RequestHandler from "./request"
import Help from "./help"
import Environ from "./environ"
import ToggleDash from "./toggle-dash"
import ToggleLauncher from "./toggle-launcher"
import { LockSession, UnlockSession } from "./lock"


// Place new request handlers in the list below. The gunk afterwards just
// makes a mapping of handler names to handlers. Duplicate names won't
// cause an error, though. The last (lexigraphically) request handler
// will be used for a conflicting name.
const requestHandlers: Map<string, RequestHandler> = [
  new Help(),
  new Environ(),
  new ToggleDash(),
  new ToggleLauncher(),
  new LockSession(),
  new UnlockSession(),
].reduce((m, v) => {
  m.set(v.name, v)
  return m
}, new Map())

export default function HandleRequest(rawRequest: string, respond: (response: any) => void) {
  try {
    var request: any

    try {
      request = JSON.parse(rawRequest)
    } catch (_) {
      request = rawRequest
    }

    if (typeof request === "string" || request instanceof String) {
      const name = request
      request = {
        name: name,
        args: [],
      }
    } else if (Array.isArray(request)) {
      const args = request
      request = {
        name: args[0],
        args: args.slice(1),
      }
    } else {
      throw new Error(`Unknown Request: ${JSON.stringify(request)}`)
    }

    if (!requestHandlers.has(request.name)) {
      throw new Error(`unknown command: ${request.name}`)
    }

    const response = requestHandlers.get(request.name)?.handler(request.args, requestHandlers)
    respond(JSON.stringify(response))
  } catch (e) {
    respond(JSON.stringify({
      "error": `${e}`,
    }))
  }
}
