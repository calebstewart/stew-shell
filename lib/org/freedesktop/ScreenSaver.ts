import { readFile } from "ags/file"

import Gio from "gi://Gio?version=2.0"

export const ScreenSaverProxy = Gio.DBusProxy.makeProxyWrapper(readFile("data/dbus/org.freedesktop.ScreenSaver.xml"))
export const ScreenSaver = ScreenSaverProxy(Gio.DBus.session, "org.freedesktop.ScreenSaver", "/org/freedesktop/ScreenSaver")
export default ScreenSaver
