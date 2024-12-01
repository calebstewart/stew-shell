import RequestHandler from "./request"

export default class Help implements RequestHandler {
  public name = "help"
  public description = "Show this help message"

  public handler(args: string[], handlers: Map<string, RequestHandler>) {
    if (args.length > 0) {
      throw new Error(`${this.name} expects no arguments`)
    }

    return Object.fromEntries(Array.from(handlers.values()).map((handler) => {
      const result = {
        usage: handler.name,
        description: handler.description,
      }

      if (handler.usage !== undefined) {
        result.usage = handler.usage
      }

      return [handler.name, result]
    }))
  }
}
