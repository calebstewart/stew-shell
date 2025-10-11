import { Gtk } from "ags/gtk4"

import AstalHyprland from "gi://AstalHyprland"

export default class PopoverRegistry {
  registry: Map<AstalHyprland.Monitor, Gtk.Popover>;

  constructor() {
    this.registry = new Map<AstalHyprland.Monitor, Gtk.Popover>;
  }

  add(monitor: AstalHyprland.Monitor, popover: Gtk.Popover) {
    this.registry.set(monitor, popover)
  }

  get(monitor: AstalHyprland.Monitor): Gtk.Popover | undefined {
    return this.registry.get(monitor);
  }

  remove(popover: Gtk.Popover) {
    for (const [k, v] of this.registry.entries()) {
      if (v === popover) {
        this.registry.delete(k);
        return;
      }
    }
  }

  popupFor(monitor: AstalHyprland.Monitor) {
    const popover = this.registry.get(monitor);
    if (popover !== undefined) {
      popover.popup();
    } else {
      for (const popover of this.registry.values()) {
        popover.popup();
        break;
      }
    }
  }

  popdownFor(monitor: AstalHyprland.Monitor) {
    const popover = this.registry.get(monitor);
    if (popover !== undefined) {
      popover.popdown();
    } else {
      for (const popover of this.registry.values()) {
        popover.popdown();
        break;
      }
    }
  }

  popup() {
    return this.popupFor(AstalHyprland.get_default().focused_monitor);
  }

  popdown() {
    return this.popdownFor(AstalHyprland.get_default().focused_monitor);
  }
}
