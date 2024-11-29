// RequestHandler implements a command executed by the AGS request
// handler. There is a basic argument parser which will split
// strings on spaces. The first argument is the name of the matching
// command, and the rest of the string is sent as an argument to
// the handler function. The args sent to the handler do not include
// the request name or the following space but are otherwise left
// untouched.
//
// The return value from the handler is 'JSON.stringify'd and sent
// back to the caller. If an exception is thrown, then it will be
// caught by the root handler, and returned as well.
export default interface RequestHandler {
  name: string
  usage?: string
  description: string
  handler: (args: string | undefined, handlers: Map<string, RequestHandler>) => any
}
