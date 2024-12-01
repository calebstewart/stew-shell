import { bind } from "astal/binding"
import { Variable } from "astal"
import BarItem, { ToggleForButtonEvent } from "./item"

const reveal = Variable(true)

export const Time = Variable("").poll(1000, "date '+%R %Z'")

export default function Clock() {
  return <BarItem
    className="Clock"
    onButtonReleaseEvent={(_, event) => ToggleForButtonEvent(event, reveal)}
    reveal={bind(reveal)}>
    <label className="fa-solid" label={"\uf017"} />
    <label label={bind(Time).as(String)} />
  </BarItem>
}

