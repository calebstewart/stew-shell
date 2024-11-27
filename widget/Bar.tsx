import { App, Astal, Gtk, Gdk } from "astal/gtk3"
import Hyprland from "gi://AstalHyprland"
import SystemTray from "./SystemTray"
import { Workspaces, ActiveClient } from "./Hyprland"
import { DashMenuButton } from "./DashMenu"

const hyprland = Hyprland.get_default()
const gdkDisplay = Gdk.Display.get_default();

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
}

// Starting blocks are normally the blocks on the left side of the bar
// unless I've decided to go insane and use a vertical bar, in which
// case, they are the blocks on the top.
function StartBlock(props: Props) {
  //{ ActiveClient(props)}
  return <box
    halign={Gtk.Align.START}>
    {ActiveClient(props.Monitor, props.MonitorIndex)}
  </box>
}

// The center block is displayed in the center of the bar and is center aligned
function CenterBlock(props: Props) {
  return <box
    halign={Gtk.Align.CENTER}>
    {Workspaces(props.Monitor, props.MonitorIndex)}
  </box>
}

function EndBlock(props: Props) {
  return <box
    className="EndBlock"
    halign={Gtk.Align.END}>
    {SystemTray()}
    {DashMenuButton()}
  </box>
}

export interface BarProps {
  gdkmonitor: Gdk.Monitor
  monitor: Hyprland.Monitor
  index: number
}

export default function Bar(gdkmonitor: Gdk.Monitor, monitorIndex: number) {
  const monitor = hyprland.get_monitors().find((m) => m.name == get_gdk_monitor_name(gdkmonitor))
  if (monitor === undefined) {
    return <window
      className="Bar"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={Astal.WindowAnchor.TOP
        | Astal.WindowAnchor.LEFT
        | Astal.WindowAnchor.RIGHT}
      application={App}
      layer={Astal.Layer.OVERLAY}
    >
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
