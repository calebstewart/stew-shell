import { Gio } from "astal"
import GioUnix from "gi://GioUnix"

// This function is invoked when the application is executed a second time. In this case, we
// use the application to act as a client to the primary UI process. The 'send_message' function
// can be use to deliver an arbitrary message to the primary process (handled through HandleRequest)
// and receive a response. The args are the command line arguments passed to the client.
export default function Entrypoint(send_message: (msg: string) => string, ...args: string[]) {
  // Open stdout in a way that we can write to it normally
  const stdout = new Gio.DataOutputStream({
    base_stream: new GioUnix.OutputStream({ fd: 1 }),
    close_base_stream: true,
  })

  // Execute the requested command
  const rawResponse = send_message(JSON.stringify(args))

  try {
    // Attempt to parse the response as JSON
    const response = JSON.parse(rawResponse)

    // If it contains an 'error' key, then this was an error response
    if ("error" in response) {
      console.error(response.error)
      return
    }
  } catch (_) { }

  // No error key, so just print the raw response
  stdout.write_all(rawResponse, null)
}
