import RequestHandler from "./request"
import Help from "./help"
import Environ from "./environ"
import ToggleDash from "./toggle-dash"
import ToggleLauncher from "./toggle-launcher"


// Place new request handlers in the list below. The gunk afterwards just
// makes a mapping of handler names to handlers. Duplicate names won't
// cause an error, though. The last (lexigraphically) request handler
// will be used for a conflicting name.
const requestHandlers: Map<string, RequestHandler> = [
  new Help(),
  new Environ(),
  new ToggleDash(),
  new ToggleLauncher(),
].reduce((m, v) => {
  m.set(v.name, v)
  return m
}, new Map())

export default function HandleRequest(request: string, respond: (response: any) => void) {
  try {
    const [name, args] = request.split(" ", 2)

    if (!requestHandlers.has(name)) {
      throw new Error(`unknown command: ${name}`)
    }

    const response = requestHandlers.get(name)?.handler(args, requestHandlers)
    respond(JSON.stringify(response))
  } catch (e) {
    respond(JSON.stringify({
      "error": `${e}`,
    }))
  }
}
