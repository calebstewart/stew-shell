import { Gtk } from "astal/gtk3"

import { PrivacyIndicators, Clock, WiredStatus, WirelessStatus } from "@components/bar"

function StartBlock() {
  return <box className="StartBlock" halign={Gtk.Align.START}>
    <box className="ActiveClient">
      <icon icon="system-lock-screen-symbolic" />
      <label label="Session Locked" />
    </box>
  </box>
}

function CenterBlock() {
  return <box className="CenterBlock" halign={Gtk.Align.CENTER}>
  </box>
}

function EndBlock() {
  return <box className="EndBlock" halign={Gtk.Align.END}>
    {WiredStatus()}
    {WirelessStatus()}
    {PrivacyIndicators()}
    {Clock()}
  </box>
}

export function Bar({ }: {}) {
  return <centerbox className="Bar" valign={Gtk.Align.START}>
    <StartBlock />
    <CenterBlock />
    <EndBlock />
  </centerbox>
}
