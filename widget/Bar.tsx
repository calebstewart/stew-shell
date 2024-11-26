import { App, Astal, Gtk, Gdk, astalify } from "astal/gtk3"
import { Variable, bind } from "astal"
import Binding from "astal/binding"
import Hyprland from "gi://AstalHyprland"
import Network from "gi://AstalNetwork"
import Bluetooth from "gi://AstalBluetooth"
import AstalApps from "gi://AstalApps"
import Notifd from "gi://AstalNotifd"
import Embermug, { temperatureToFahrenheit, MugState, mugStateName } from "./Embermug"
import SystemTray from "./SystemTray"
import { AstalMenu, AstalMenuItem } from "./Builtin"

const apps = AstalApps.Apps.new()
const applicationList = Variable<AstalApps.Application[]>([]).poll(10000, (_) => {
  apps.reload()
  return apps.get_list()
})
const localTime = Variable("").poll(1000, "date '+%R %Z'")
const hyprland = Hyprland.get_default()
const gdkDisplay = Gdk.Display.get_default();

const bluetooth = Bluetooth.get_default()
const notifd = Notifd.get_default()

// Translate a GDK monitor to it's underlying port name (e.g. HDMA-1)
// This is necessary to correctly map GDK monitors to Hyprland monitors.
function get_gdk_monitor_name(monitor: Gdk.Monitor) {
  if (gdkDisplay === null) {
    return ""
  }

  const screen = gdkDisplay.get_default_screen();
  for (let i = 0; i < gdkDisplay.get_n_monitors(); ++i) {
    if (monitor === gdkDisplay.get_monitor(i)) {
      return screen.get_monitor_plug_name(i)
    }
  }
}

// These are the properties available to the various bar blocks
type Props = {
  Monitor: Hyprland.Monitor,
  GdkMonitor: Gdk.Monitor,
  MonitorIndex: number,
  SystemMenu: Gtk.Widget,
}

// Display a selection of existing workspaces for this monitor. The
// block will create buttons for workspaces 1-9 mapped to
// (monitorIndex * 10 + workspaceNum). This is how split workspaces
// works. The buttons are hidden by a Gtk.Revealer unless they
// already exist. Clicking on them will switch to that workspace
// using the 'hyprland.dispatch()' method and the 'split:workspace'
// endpoint.
function Workspaces({ MonitorIndex: monitorIndex }: Props) {
  // Create a workspace button for each potential workspace on this monitor.
  // We assume that workspaces are named like "1" through "9" for monitorIndex == 0,
  // and "51" through "59" for monitorIndex == 5. This is how splitworkspaces plugin
  // works, so it's a pretty solid bet.
  const buttons = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
    const name = (monitorIndex * 10 + i).toString(); // (0,7) => 7, (5,3) => 53, etc.

    // Create a revealer which will animate the creation/deletion of workspaces on this monitor
    return <revealer
      // Map reveal to whether the workspace exists
      revealChild={bind(hyprland, "workspaces").as((ws) => ws.some((ws) => ws.name == name))}
      // Slide right for creation
      transitionType={Gtk.RevealerTransitionType.SLIDE_RIGHT} >
      <button
        // Add the "focused" class when the workspace is active
        className={bind(hyprland, "focused_workspace").as((ws) => ws.name == name ? "focused" : "")}
        onClicked={() => hyprland.dispatch("split:workspace", name)}
        label={i.toString()} />
    </revealer>
  });

  return <box className="Workspaces">
    {buttons}
  </box>;
}

// Starting blocks are normally the blocks on the left side of the bar
// unless I've decided to go insane and use a vertical bar, in which
// case, they are the blocks on the top.
function StartBlock(props: Props) {
  return <box
    halign={Gtk.Align.START}>
    {ActiveClient(props)}
  </box>
}

function get_icon(client: Hyprland.Client): string {
  if (Astal.Icon.lookup_icon(client.initial_class) !== null) {
    return client.initial_class
  } else {
    const icon_name = applicationList.get().find((app) => app.wm_class == client.initial_class)?.icon_name
    if (icon_name === undefined) {
      return "display"
    } else {
      return icon_name
    }
  }
}

// Display the icon and title of the most recent active client for the current
// monitor. This will respond to client changes to their own title as well as
// changes in focus within the same monitor. Changes in focus while interacting
// with other monitors will not change the active client title label or icon.
function ActiveClient({ Monitor: monitor, MonitorIndex: monitorIndex }: Props) {
  var title = Variable("")
  var iconName = Variable("")

  // Connect to Hyprland events, so we can keep track of the
  // active client on our monitor, and set the appropriate
  // icon.
  var id = hyprland.connect("event", () => {
    var client = hyprland.focused_client
    if (client === null && hyprland.focused_monitor === monitor) {
      iconName.set("display")
      title.set(`Monitor ${monitorIndex}`)
    } else if (client !== null && client.monitor === monitor) {
      iconName.set(get_icon(client))
      title.set(client.title)
    }
  })

  return <revealer
    reveal_child={bind(title).as((t) => t != "")}
    transition_type={Gtk.RevealerTransitionType.SLIDE_LEFT} >
    <box className="ActiveClient">
      <icon icon={bind(iconName)} />
      <label
        onDestroy={(_) => {
          title.drop()
          hyprland.disconnect(id)
        }}
        truncate
        label={bind(title)} />
    </box>
  </revealer>
}

// The center block is displayed in the center of the bar and is center aligned
function CenterBlock(props: Props) {
  return <box
    halign={Gtk.Align.CENTER}>
    {Workspaces(props)}
  </box>
}

// Display the current time and a time icon
function Clock() {
  return <box className="Clock">
    <label className="embermugIcon" label={"\uf017"} />
    <label className="Time IconLabel" label={bind(localTime)} />
  </box>
}

function EmbermugWidget() {
  const mug = Embermug.get_default()

  return <box className="Embermug">
    <label className="Icon" label={"\uf0f4"} />
    <label className="State IconLabel" label={bind(mug).as((mug) => {
      if (!mug.Connected) {
        return "Disconnected"
      }

      const current = Math.round(temperatureToFahrenheit(mug.Current)).toString()
      const target = Math.round(temperatureToFahrenheit(mug.Target)).toString()
      const stateName = mugStateName(mug.State)

      switch (mug.State) {
        case MugState.COOLING:
        case MugState.HEATING:
          return `${stateName} (${current}F/${target}F)`
        case MugState.STABLE:
          return `${stateName} (${current}F)`
        default:
          return stateName
      }
    })} />
  </box>
}

function BluetoothWidget() {
  const menu = <AstalMenu className="BluetoothMenu">
    {bind(bluetooth, "devices").as((devices) => devices.map((device) => {
      const icon = Variable.derive([bind(device, "connected"), bind(device, "connecting")], (connected, connecting) => {
        if (connected) {
          return "bluetooth-active"
        } else if (connecting) {
          return "network-wireless-acquiring"
        } else {
          return "bluetooth-disabled"
        }
      })

      return <AstalMenuItem onDestroy={() => icon.drop()} onActivate={() => {
        if (device.connected) {
          device.disconnect_device((_dev, res) => {
            device.disconnect_device_finish(res)
          })
        } else {
          device.connect_device((_dev, res) => {
            device.connect_device_finish(res)
          })
        }
      }}>
        <box>
          <icon icon={bind(icon)} />
          <label label={bind(device, "name").as(String)} />
        </box>
      </AstalMenuItem>
    }))}
  </AstalMenu> as Gtk.Menu

  const realBox = <box>
    <icon icon={bind(bluetooth, "is-powered").as((p) => p ? "bluetooth-active" : "bluetooth-disabled")} />
    <label visible={false} className="State IconLabel" label={bind(bluetooth, "devices").as((devices) => {
      const connected = devices.filter((d) => d.connected)

      if (connected.length == 0) {
        const connecting = devices.filter((d) => d.connecting)
        if (connecting.length > 1) {
          return `${connecting.length} Connecting`
        } else if (connecting.length == 1) {
          return `${connecting[0].name} Connecting`
        } else {
          return "Disconnected"
        }
      } else if (connected.length == 1) {
        return connected[0].name
      } else {
        return `${connected.length} Connected`
      }
    })} />
  </box>

  return <box className="Bluetooth">
    <eventbox onButtonReleaseEvent={(box, event) => {
      const [has_button, button] = event.get_button()
      if (!has_button || button != 3) {
        return
      }

      menu.popup_at_widget(realBox, Gdk.Gravity.SOUTH_WEST, Gdk.Gravity.NORTH_WEST, event)
    }}>
      {realBox}
    </eventbox>
  </box>
}

// Display the network status. For wired networks, this displays only the
// IP address. For wireless networks, it displays the SSID and IP address.
function NetworkStatus() {
  const network = Network.get_default();
  const wifi = network.wifi;
  const wired = network.wired;

  if (network.primary === Network.Primary.WIRED) {
    return <box
      className="Wired Network" >
      <icon icon={bind(wired, "icon_name")} />
      <label className="IconLabel" label={bind(wired, "device").as((d) => d.ip4_config.get_addresses()[0].get_address())} />
    </box>
  } else if (network.primary === Network.Primary.WIFI) {
    return <box
      className="Wireless Network" >
      <icon icon={bind(wifi, "icon_name")} />
      <label className="IconLabel" label={bind(wifi, "ssid").as((s) => `${s} (${wifi.device.ip4_config.get_addresses()[0].get_address()})`)} />
    </box>
  }
}

// Show/hide the notification pane to view active notifications
function SystemMenuButton({ SystemMenu }: Props) {
  return <button className="SystemMenuButton" onClicked={() => {
    if (SystemMenu.visible) {
      SystemMenu.hide()
    } else {
      SystemMenu.show()
    }
  }}>
    <label label={"\uf0c9"} />
  </button>
}

function EndBlock(props: Props) {
  return <box
    className="EndBlock"
    halign={Gtk.Align.END}>
    {SystemTray()}
    {SystemMenuButton(props)}
  </box>
}

export function Menubar(gdkmonitor: Gdk.Monitor, monitorIndex: number) {
  return <window
    className="Bar"
    gdkmonitor={gdkmonitor}
    exclusivity={Astal.Exclusivity.EXCLUSIVE}
    anchor={Astal.WindowAnchor.TOP
      | Astal.WindowAnchor.LEFT
      | Astal.WindowAnchor.RIGHT}
    application={App}>
    <Gtk.MenuBar visible>
      <Gtk.MenuItem visible label="Test" />
    </Gtk.MenuBar>
  </window>
}

export default function Bar(gdkmonitor: Gdk.Monitor, monitorIndex: number, systemMenu: Gtk.Widget) {
  const monitor = hyprland.get_monitors().find((m) => m.name == get_gdk_monitor_name(gdkmonitor))
  if (monitor === undefined) {
    return <window
      className="Bar"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={Astal.WindowAnchor.TOP
        | Astal.WindowAnchor.LEFT
        | Astal.WindowAnchor.RIGHT}
      application={App}>
      <centerbox>
        <box>
          <label label="Could not find associated Hyprland monitor" />
        </box>
        <box />
        <box />
      </centerbox>
    </window>
  }

  const props: Props = {
    GdkMonitor: gdkmonitor,
    Monitor: monitor,
    MonitorIndex: monitorIndex,
    SystemMenu: systemMenu,
  }

  return <window
    className="Bar"
    gdkmonitor={gdkmonitor}
    exclusivity={Astal.Exclusivity.EXCLUSIVE}
    anchor={Astal.WindowAnchor.TOP
      | Astal.WindowAnchor.LEFT
      | Astal.WindowAnchor.RIGHT}
    application={App}>
    <centerbox>
      {StartBlock(props)}
      {CenterBlock(props)}
      {EndBlock(props)}
    </centerbox>
  </window>
}
