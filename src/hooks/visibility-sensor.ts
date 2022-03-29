import React from "react";

export function useVisibilitySensor(cb, threshold = 0) {
  const xoRef = React.useRef<IntersectionObserver>();

  return React.useCallback((node) => {
    if (!node) return xoRef.current!.disconnect();

    let lastVisibility = false;
    xoRef.current = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.intersectionRatio > 0;
        if (isVisible !== lastVisibility) {
          lastVisibility = isVisible;
          cb(isVisible);
        }
      },
      { threshold }
    );
    xoRef.current.observe(node);
  }, []);
}
