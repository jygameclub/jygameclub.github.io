function InvokeBugsnagError(type, code, data) {
    var message = "test | " + type + " | " + code + " | " + data + " | " + buildVersion;

    Bugsnag.notify(new Error(data), event => {
      event.errors[0].errorClass = "" + code;
      event.errors[0].errorMessage = "" + message;
      event.errors[0].severity = "error";
    });
}
