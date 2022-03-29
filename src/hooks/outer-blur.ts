import React from "react";

export default function (cb) {
  const state = React.useRef<any>();
  const timerId = React.useRef<any>();
  const cbRef = React.useRef<any>();

  cbRef.current = cb;

  return React.useCallback((el) => {
    if (!el) {
      const { el, onFocus, onBlur } = state.current;
      el.removeEventListener("focus", onFocus, true);
      el.removeEventListener("blur", onBlur, true);
      return;
    }

    if (!el.tabIndex) el.tabIndex = -1;

    state.current = {
      el,
      onFocus: () => clearTimeout(timerId.current),
      onBlur: () => (timerId.current = setTimeout(() => cbRef.current())),
    };

    el.addEventListener("focus", state.current.onFocus, true);
    el.addEventListener("blur", state.current.onBlur, true);
  }, []);
}
