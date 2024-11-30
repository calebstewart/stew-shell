import { bind } from "astal"
import { Astal, Gdk, Widget } from "astal/gtk3"

const Anchor = Astal.WindowAnchor

export interface PopupWindowProps extends Widget.WindowProps { }

export function PopupWindow(windowprops: PopupWindowProps) {
  const { onKeyPressEvent, name, child, application, layer, exclusivity, ...props } = windowprops
  const hideOnEscape = (w: Widget.Window, _: Gdk.Event) => {
    w.get_toplevel().hide()
  }

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
    onKeyPressEvent={onKeyPressEvent}
    application={application}>
    {child}
  </window>

  // The closer window is responsible for intercepting any button press events
  // and hiding the primary popup window. This makes the window "feel" like a popup
  // menu even though it isn't technically. We use inline CSS to make the window
  // invisible. We could do it in our SCSS file, but since PopupWindow is a utility,
  // it feels nicer to be "self-contained".
  const _closer = <window
    name={`${name}Closer`}
    layer={Astal.Layer.TOP}
    visible={bind(window, "visible")}
    application={application}
    anchor={Anchor.LEFT | Anchor.RIGHT | Anchor.TOP | Anchor.BOTTOM}
    css={"background: transparent"}>
    <eventbox onButtonReleaseEvent={() => {
      window.hide()
    }} />
  </window>

  return window
}
