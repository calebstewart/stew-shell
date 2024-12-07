import { Gio } from "astal"
import { Variable } from "astal"
import { Subscribable } from "astal/binding"
import { idle, timeout } from "astal/time"

export enum MugState {
  INVALID = 0,
  EMPTY,
  FILLING,
  UNKNOWN,
  COOLING,
  HEATING,
  STABLE,
}

export function MugStateToString(s: MugState): string {
  switch (s) {
    case MugState.EMPTY:
      return "empty"
    case MugState.FILLING:
      return "filling"
    case MugState.UNKNOWN:
      return "unknown"
    case MugState.COOLING:
      return "cooling"
    case MugState.HEATING:
      return "heating"
    case MugState.STABLE:
      return "stable"
    default:
      return "invalid"
  }
}

export interface MugBatteryState {
  Charge: number
  Charging: boolean
  Temperature: number
  Voltage: number
}

export interface Mug {
  Connected: boolean
  State: MugState
  Target: number
  Current: number
  Battery: MugBatteryState
  HasLiquid: boolean
}

// Convert an embermug temperature to celsius
export function ToCelsius(t: number): number {
  return (t / 100.0)
}

// Convert an embermug temperature to fahrenheit
export function ToFahrenheit(t: number): number {
  return 32 + ((t * 9.0) / 500.0)
}

// Embermug client
export class EmbermugClient implements Subscribable<Mug> {
  private static _singleton: EmbermugClient | null = null

  private mug: Variable<Mug> // Variable holding the current state of the mug
  private cancellable: Gio.Cancellable // Cancellation signal
  private address: Gio.UnixSocketAddress // Socket address for the Embermug service
  private client: Gio.SocketClient // Client used to connect to the socket
  private client_event_handle: number // Handle to the client event signal handler
  // private connection_lock: GLib.Mutex // Lock for modifying the connection
  private connection: Gio.SocketConnection | null // The active connection, if any

  private constructor(socketPath: string) {
    this.cancellable = Gio.Cancellable.new()
    // this.connection_lock = new GLib.Mutex()
    // this.connection_lock.init()
    this.connection = null
    this.mug = Variable({
      Connected: false,
      State: MugState.INVALID,
      Target: 0,
      Current: 0,
      HasLiquid: false,
      Battery: {
        Charge: 0,
        Charging: false,
        Temperature: 0,
        Voltage: 0,
      },
    })
    this.address = Gio.UnixSocketAddress.new(socketPath)
    this.client = Gio.SocketClient.new()
    this.client_event_handle = this.client.connect_after("event", (_client, event, _connectable, connection) => {
      this.client_event(_client, event, _connectable, connection)
    })
    this.schedule_connect()
  }

  public static get_default(): EmbermugClient {
    if (EmbermugClient._singleton === null) {
      EmbermugClient._singleton = new EmbermugClient("/tmp/embermug.sock")
    }

    return EmbermugClient._singleton
  }

  public subscribe(callback: (value: Mug) => void): () => void {
    return this.mug.subscribe(callback)
  }

  public get(): Mug {
    return this.mug.get()
  }

  private schedule_connect() {
    idle(() => {
      this.client.connect_async(this.address, this.cancellable, (_, res) => {
        try {
          this.client.connect_finish(res)
        } catch (e) {
          // Retry the connection in 1 second
          console.log(`failed to connect to embermug socket: ${e}`)
          timeout(1000, this.schedule_connect)
        }
      })
    })
  }

  public drop() {
    // Signal to background loops that we want to cancel
    this.cancellable.cancel()

    // Disconnect the event handler for the client
    this.client.disconnect(this.client_event_handle)

    // Disconnect the client
    // this.connection_lock.lock()
    try {
      this.connection?.close()
      this.connection = null
    } finally {
      // this.connection_lock.unlock()
    }
  }

  private client_event(
    _client: Gio.SocketClient, // Unecessary (we have this.client)
    event: Gio.SocketClientEvent, // What happened?
    _connectable: Gio.SocketConnectable, // The address that was connected
    connection: Gio.IOStream | null // The socket connection if applicable
  ) {
    if (event != Gio.SocketClientEvent.CONNECTED || connection === null) {
      return
    }

    // Don't handle the connection if we have been cancelled
    if (this.cancellable.is_cancelled()) {
      connection.close()
      return
    }

    // Lock the connection
    // this.connection_lock.lock()
    try {
      if (this.connection !== null && this.connection.is_connected()) {
        // Ignore the new connection since we already have one
        connection.close()
        return
      } else {
        // Replace the connection
        this.connection = connection as Gio.SocketConnection

        // Start reading the connection
        const reader = Gio.DataInputStream.new(this.connection.input_stream)
        reader.read_line_async(0, this.cancellable, (stream, result) => this.connection_read_finished(stream, result))
      }
    } finally {
      // this.connection_lock.unlock()
    }

    return
  }

  private connection_read_finished(
    stream: Gio.DataInputStream | null,
    result: Gio.AsyncResult,
  ) {
    if (stream === null || stream.is_closed()) {
      this.connection?.close(null)
      this.schedule_connect()
      return
    }

    try {
      const [line, _count] = stream.read_line_finish_utf8(result)
      if (line === null) {
        console.log(`null line when reading from embermug socket`)
        this.connection?.close(null)
        this.schedule_connect()
        return
      }

      const rawObj = JSON.parse(line)
      if (rawObj === null || typeof rawObj !== "object") {
        console.log(`non-object when reading from embermug socket: ${rawObj}`)
        this.connection?.close(null)
        this.schedule_connect()
        return
      }

      // NOTE: This is not type-safe, but we know the structure
      // of the embermug service output, and it will always be
      // the state structure unless there is a breaking change.
      this.mug.set(rawObj as Mug)

      // Now, schedule the next read
      stream.read_line_async(0, this.cancellable, (stream, result) => this.connection_read_finished(stream, result))
    } catch (e) {
      console.log(`reading line from embermug socket failed: ${e}`)
      this.connection?.close(null)
      this.schedule_connect()
    }
  }
}
