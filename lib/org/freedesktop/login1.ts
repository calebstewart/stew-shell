import { readFile } from "ags/file"

import Gio from "gi://Gio?version=2.0"

export const ManagerProxy = Gio.DBusProxy.makeProxyWrapper(readFile("data/dbus/org.freedesktop.login1.Manager.xml"))
export const Manager = ManagerProxy(Gio.DBus.system, "org.freedesktop.login1", "/org/freedesktop/login1")

export const SessionProxy = Gio.DBusProxy.makeProxyWrapper(readFile("data/dbus/org.freedesktop.login1.Session.xml"))

export function get_active_session(): Gio.DBusProxy {
  const credentials = new Gio.Credentials()
  const pid = credentials.get_unix_pid()
  const sessionPath = Manager.GetSessionByPIDSync(pid)

  if (sessionPath.length === 0) {
    throw new Error("Could not find active login session")
  }

  return SessionProxy(Gio.DBus.system, "org.freedesktop.login1", sessionPath[0])
}
