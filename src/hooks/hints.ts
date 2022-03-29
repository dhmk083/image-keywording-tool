import React from "react";

export default function useHints(value, limit = 1) {
  const [hints, setHints] = React.useState([value]);

  React.useEffect(() => {
    value.length &&
      setHints((prev) => [...new Set([...prev, value])].slice(-limit));
  }, [value, limit]);

  return hints;
}
