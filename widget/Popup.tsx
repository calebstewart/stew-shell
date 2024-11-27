import Binding, { bind } from "astal/binding"
import { App, Astal, Gtk, Gdk } from "astal/gtk3"

// Create a window that covers the entire screen, is invisible, and captures mouse clicks.
// If it receives a primary click, then it closes the target window, and
// itself.
export default function PopupCloser(
  name: string,
  monitor: Gdk.Monitor | Binding<Gdk.Monitor>,
  window: Gtk.Window,
  callback: () => void = () => { }
) {
  return <window
    name={name}
    className={name}
    layer={Astal.Layer.TOP}
    gdkmonitor={monitor}
    visible={false}
    application={App}
    anchor={Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT | Astal.WindowAnchor.TOP | Astal.WindowAnchor.BOTTOM}
  >
    <eventbox onButtonReleaseEvent={(box, event) => {
      const [has_button, button] = event.get_button()
      if (has_button && button === 1) {
        window.hide()
        box.get_toplevel()?.hide()
        callback()
      }
    }} />
  </window> as Gtk.Window
}
