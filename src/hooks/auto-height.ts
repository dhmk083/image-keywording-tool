import React from "react";

export default function useAutoHeight() {
  const elRef = React.useRef<HTMLElement>();

  const setHeight = () => {
    const el = elRef.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  React.useEffect(setHeight);

  return React.useCallback((el) => {
    if (el) {
      el.addEventListener("input", setHeight);
    } else {
      elRef.current!.removeEventListener("input", setHeight);
    }

    elRef.current = el;
  }, []);
}
