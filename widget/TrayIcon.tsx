import { Variable } from "astal"
import { Gtk, Gdk } from "astal/gtk3"
import Binding, { bind, Connectable, Subscribable } from "astal/binding"

export type TrayIconProps = {
  className: string,
  icon: Gtk.Widget,
  label: string | Binding<string>,
  onButtonReleased: (icon: Gtk.Widget, event: Gdk.Event) => void
  onDestroy?: () => void,
  lockReveal?: boolean | Binding<boolean>
}

export function RevealValue(event: Gdk.Event, value: boolean, button: number = 1): boolean {
  const [has_button, pressedButton] = event.get_button()
  if (!has_button || pressedButton != button) {
    return value
  }


  return !value
}

export default function TrayIcon({ className, icon, label, onButtonReleased, onDestroy, lockReveal }: TrayIconProps) {
  if (lockReveal === undefined) {
    lockReveal = bind(Variable(false))
  }

  if (onDestroy === undefined) {
    onDestroy = () => { }
  }

  if (lockReveal === false || lockReveal === true) {
    lockReveal = bind(Variable(lockReveal))
  }

  const has_hover = Variable<boolean>(false)
  const reveal_child = Variable.derive([lockReveal, has_hover], (hold, has_hover) => hold || has_hover)

  const labelAndIcon = <box
    onDestroy={() => reveal_child.drop()}
    className="systemTrayItemContainer">
    {icon}
    <revealer reveal_child={bind(reveal_child)} transition_type={Gtk.RevealerTransitionType.SLIDE_RIGHT}>
      <label label={label} />
    </revealer>
  </box>
  icon.get_style_context().add_class("systemTrayIcon")

  return <box className={`systemTrayItem ${className}`} onDestroy={onDestroy}>
    <eventbox
      onHover={() => has_hover.set(true)}
      onHoverLost={() => has_hover.set(false)}
      onButtonReleaseEvent={(_eventbox, event) => {
        return onButtonReleased(labelAndIcon, event)
      }}>
      {labelAndIcon}
    </eventbox>
  </box>
}
