import { Accessor } from "ags"
import { Gtk } from "ags/gtk4"
import { createPoll } from "ags/time"

import GLib from "gi://GLib"

export default function Clock({ reveal }: {
  reveal: Accessor<boolean>,
}) {
  const datetime = createPoll(GLib.DateTime.new_now_local(), 1000, () => {
    return GLib.DateTime.new_now_local()
  })
  const time = datetime((v: GLib.DateTime) => v.format("%R")!)

  return (
    <box class="tray-item">
      <label label={time} />
    </box >
  )
}
