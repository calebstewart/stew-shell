import Gio from "gi://Gio?version=2.0"
import GObject from "gi://GObject?version=2.0";
import Gtk from "gi://Gtk?version=4.0"
import Adw from "gi://Adw?version=1"
import app from "ags/gtk4/app";
import { For, This, createBinding } from "ags";

import { Bar } from "@components/bar";
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

    <For each={monitors}>
      {(monitor, index) => (
        <This this={app}>
          <Bar monitor={monitor} index={index} />
        </This>
      )}
    </For>
  },
});
