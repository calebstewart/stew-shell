import { App, Gdk, Gtk } from "astal/gtk3"

export default function RegisterPerMonitorWindows(
  registry: Map<Gdk.Monitor, Gtk.Widget>,
  ctor: (monitor: Gdk.Monitor, index: number) => Gtk.Widget,
): () => void {
  const addedId = App.connect("monitor-added", (_, new_monitor) => {
    App.get_monitors().forEach((monitor, index) => {
      if (monitor === new_monitor) {
        registry.set(monitor, ctor(monitor, index))
      }
    })
  })

  const removedId = App.connect("monitor-removed", (_, monitor) => {
    registry.get(monitor)?.destroy()
    registry.delete(monitor)
  })

  App.get_monitors().forEach((monitor, index) => {
    if (!registry.has(monitor)) {
      registry.set(monitor, ctor(monitor, index))
    }
  })

  return () => {
    App.disconnect(addedId)
    App.disconnect(removedId)
  }
}
