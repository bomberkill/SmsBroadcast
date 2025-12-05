import ExpoModulesCore

public class ExpoSmsManagerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoSmsManager")

    AsyncFunction("sendSms") { (phoneNumbers: [String], message: String) in
      return [
        "status": "unsupported",
        "message": "Silent SMS is not possible on iOS."
      ]
    }
  }
}
