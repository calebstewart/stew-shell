import { Variable, bind } from "astal"
import { Astal, App, Gdk, Gtk, Widget } from "astal/gtk3"

const Anchor = Astal.WindowAnchor

export const VisiblePopup = Variable<string | null>(null)

export interface PopupWindowProps extends Widget.WindowProps {
  name: string
  onShow?: (w: Gtk.Widget) => void
  onHide?: (w: Gtk.Widget) => void
}

export function ShowPopup(name: string) {
  if (App.get_window(name) !== null) {
    VisiblePopup.set(name)
  }
}

export function TogglePopup(name: string) {
  if (VisiblePopup.get() === name) {
    VisiblePopup.set(null)
    return false
  } else if (App.get_window(name) !== null) {
    VisiblePopup.set(name)
    return true
  } else {
    return false
  }
}

export function HidePopup(name: string) {
  if (VisiblePopup.get() === name) {
    VisiblePopup.set(null)
  }
}

export function ActivePopup() {
  return VisiblePopup.get()
}

export function PopupWindow(windowprops: PopupWindowProps) {
  const { onKeyPressEvent, name, child, application, layer, exclusivity, ...props } = windowprops
  const hideOnEscape = (_w: Widget.Window, event: Gdk.Event) => {
    const [has_keyval, keyval] = event.get_keyval()
    if (has_keyval && keyval == Gdk.KEY_Escape) {
      HidePopup(name)
    }
  }

  const visible = bind(VisiblePopup).as((v) => v === name)

  // If the primary window uses the onKeyPressEvent signal, then we need to wrap
  // their handler to hide when escape is pressed. Otherwise, just assign our
  // callback directly.
  var newKeyPressHandler = hideOnEscape
  if (onKeyPressEvent !== undefined) {
    newKeyPressHandler = (w: Widget.Window, e: Gdk.Event) => {
      hideOnEscape(w, e)
      return onKeyPressEvent(w, e)
    }
  }

  // Create the primary window as requested. We explicitly set the layer and
  // exclusivity values. This ensures that the primary window is on top of
  // our closer window. Most properties, we just pass through.
  const window = <window
    {...props}
    name={name}
    layer={Astal.Layer.OVERLAY}
    exclusivity={Astal.Exclusivity.EXCLUSIVE}
    onKeyPressEvent={newKeyPressHandler}
    visible={visible}
    application={application}>
    {child}
  </window> as Gtk.Window

  // The closer window is responsible for intercepting any button press events
  // and hiding the primary popup window. This makes the window "feel" like a popup
  // menu even though it isn't technically. We use inline CSS to make the window
  // invisible. We could do it in our SCSS file, but since PopupWindow is a utility,
  // it feels nicer to be "self-contained".
  const closer = <window
    name={`${name}Closer`}
    className={`PopupCloser ${name}Closer`}
    namespace="PopupCloser"
    layer={Astal.Layer.TOP}
    visible={bind(window, "visible")}
    application={application}
    anchor={Anchor.LEFT | Anchor.RIGHT | Anchor.TOP | Anchor.BOTTOM}>
    <eventbox onButtonReleaseEvent={() => {
      HidePopup(name)
    }} />
  </window>

  // Ensure the closer is destroyed when the popup is destroyed
  window.connect("destroy", () => {
    HidePopup(name)
    closer.destroy()
  })

  return window
}
