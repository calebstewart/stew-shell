import { bind } from "astal/binding"
import { Variable } from "astal"
import TrayIcon, { RevealValue } from "./TrayIcon"

const localTime = Variable("").poll(1000, "date '+%R %Z'")
const clockReveal = Variable(true)

export function ClockTrayIcon() {
  return TrayIcon({
    className: "Clock",
    icon: <label className="fa-solid" label={"\uf017"} />,
    label: bind(localTime).as(String),
    onButtonReleased: (_widget, event) => clockReveal.set(RevealValue(event, clockReveal.get())),
    lockReveal: bind(clockReveal),
  })
}
