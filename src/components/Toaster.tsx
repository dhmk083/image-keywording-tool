import React from "react";
import { ToastProvider, useToasts } from "react-toast-notifications";

export default ({ children }) => (
  <ToastProvider>
    <Toaster>{children}</Toaster>
  </ToastProvider>
);

const Toaster = ({ children }) => {
  const { addToast } = useToasts();

  const showError = React.useCallback(
    (msgErr) => {
      addToast(msgErr.toString(), {
        appearance: "error",
        autoDismiss: false,
      });
    },
    [addToast]
  );

  return React.cloneElement(children, { showError });
};
