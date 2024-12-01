import { App } from "astal/gtk3"
import style from "./style/main.scss"
import HandleRequest from "./request"
import Entrypoint from "./components"
import ClientEntry from "./client"

App.start({
  // instanceName: "dev",
  css: style,
  main: Entrypoint,
  requestHandler: HandleRequest,
  client: ClientEntry,
})
