import Gio from "gi://Gio?version=2.0"
import GObject from "gi://GObject?version=2.0";
import Gtk from "gi://Gtk?version=4.0"
import Adw from "gi://Adw?version=1"
import app from "ags/gtk4/app";
import { For, This, createBinding } from "ags";
import { interval } from "ags/time";

import { Apps } from "@components/launcher";
import { Bar } from "@components/bar";
import { NotificationCenter } from "@components/notifd";
import style from "./style/main.scss";
import HandleRequest from "./requests";

class Application extends Adw.Application {
  static {
    GObject.registerClass(this);
  }

  constructor() {
    super({
      application_id: "shell.calebstew.art",
      flags: Gio.ApplicationFlags.HANDLES_COMMAND_LINE,
    })
  }

  vfunc_command_line(cmd: Gio.ApplicationCommandLine): number {

  }

  private main(args: string[]) {
  }
}

app.start({
  css: style,
  requestHandler: HandleRequest,
  main: function() {
    const monitors = createBinding(app, "monitors");

    // Reload applications every 10 seconds
    interval(10000, () => Apps.reload());

    return <For each={monitors}>
      {(monitor, index) => (
        <This this={app}>
          <Bar gdkmonitor={monitor} index={index} />
          <NotificationCenter gdkmonitor={monitor} index={index} />
        </This>
      )}
    </For>
  },
});
