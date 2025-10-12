import { register, property, signal } from "gnim/gobject"

import GObject from "gi://GObject"

@register({ GTypeName: "LoginManager" })
class LoginManager extends GObject.Object {

}
