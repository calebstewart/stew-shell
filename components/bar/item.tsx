import { Variable } from "astal"
import Binding, { bind } from "astal/binding"
import { Gtk, Gdk } from "astal/gtk3"

export interface BarItemProps {
  className: string | Binding<string>,
  child?: JSX.Element | undefined,
  children?: JSX.Element | JSX.Element[],
  reveal?: boolean | Binding<boolean>,
  onButtonReleaseEvent?: (eventbox: Gtk.EventBox, event: Gdk.Event) => void,
  onDestroy?: (widget: Gtk.Widget) => void,
}

export function ToggleForButtonEvent(event: Gdk.Event, v: Variable<boolean>, button: number = 1) {
  const current = v.get()
  const [has_button, pressed_button] = event.get_button()
  if (!has_button || pressed_button != button) {
    return current
  }

  v.set(!current)
  return !current
}

export default function BarItem({ className, child, children, reveal, onButtonReleaseEvent, onDestroy }: BarItemProps) {
  if (reveal === false || reveal === true) {
    reveal = bind(Variable(reveal))
  }

  if (className instanceof String || typeof className === 'string') {
    className = `BarItem ${className}`
  } else {
    className = className.as((v) => `BarItem ${v}`)
  }

  reveal = reveal || bind(Variable(false))
  onButtonReleaseEvent = onButtonReleaseEvent || (() => { })
  onDestroy = onDestroy || (() => { })
  children ??= []

  if (!Array.isArray(children)) {
    children = [children]
  }

  if (child !== undefined) {
    children = [child, ...children]
  }

  if (children.length == 0) {
    throw new Error("bar item requires at least one child for the icon")
  } else if (children.length > 2) {
    throw new Error("bar item can only have a maximum of 2 children")
  }

  const has_hover = Variable<boolean>(false)
  const derived_reveal = Variable.derive([reveal, has_hover], (reveal, hover) => reveal || hover)

  return <box className={className} onDestroy={onDestroy}>
    <eventbox
      onHover={() => has_hover.set(true)}
      onHoverLost={() => has_hover.set(false)}
      onButtonReleaseEvent={onButtonReleaseEvent}>
      <box onDestroy={() => derived_reveal.drop()} className="BarItemContainer">
        {children[0]}
        {children.length > 1 && <revealer
          reveal_child={bind(derived_reveal)}
          transition_type={Gtk.RevealerTransitionType.SLIDE_RIGHT}>
          {children[1]}
        </revealer>}
      </box>
    </eventbox>
  </box>
}
