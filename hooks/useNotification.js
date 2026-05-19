import { useNotifications } from "@/context/NotificationContext";

/**
 * Hook to easily show notifications
 * Usage:
 * const notify = useNotification();
 * notify.success("Success!", "Operation completed");
 * notify.error("Error!", "Something went wrong");
 * notify.info("Info", "Here's some information");
 * notify.warning("Warning!", "Please be careful");
 */
export function useNotification() {
  const { addNotification } = useNotifications();

  const toOptions = (thirdArg, fourthArg) => {
    if (typeof thirdArg === "object" && thirdArg !== null) {
      return thirdArg;
    }

    if (typeof thirdArg === "string") {
      return {
        sourceTab: thirdArg,
        autoClose: true,
      };
    }

    if (typeof fourthArg === "string") {
      return {
        sourceTab: fourthArg,
        autoClose: typeof thirdArg === "boolean" ? thirdArg : true,
      };
    }

    return {
      autoClose: typeof thirdArg === "boolean" ? thirdArg : true,
    };
  };

  const send = (type, title, message, thirdArg, fourthArg) => {
    const options = toOptions(thirdArg, fourthArg);

    addNotification({
      type,
      title,
      message,
      autoClose: options.autoClose,
      sourceTab: options.sourceTab || options.tab || options.source || null,
      route: options.route || options.path || options.url || options.href || null,
    });
  };

  return {
    success: (title, message = "", thirdArg, fourthArg) =>
      send("success", title, message, thirdArg, fourthArg),
    error: (title, message = "", thirdArg, fourthArg) =>
      send("error", title, message, thirdArg, fourthArg),
    info: (title, message = "", thirdArg, fourthArg) =>
      send("info", title, message, thirdArg, fourthArg),
    warning: (title, message = "", thirdArg, fourthArg) =>
      send("warning", title, message, thirdArg, fourthArg),
  };
}
