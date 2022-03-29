import { useRefLive, useStateMerge } from "@dhmk/react";

type ItemsSelector = {
  selection: ReadonlySet<number>;
  isSelected(i: number): boolean;
  select(i: number, ev: { shiftKey; ctrlKey });
  selectAll();
  selectNone();
};

type _ItemsSelector = ItemsSelector & {
  lastIndex: number;
};

export default function useItemsSelector(_getSize: () => number) {
  const getSize = useRefLive(_getSize);

  const [state, set, get] = useStateMerge<_ItemsSelector>(() => {
    return {
      lastIndex: 0,
      selection: new Set(),

      isSelected: (i) => get().selection.has(i),

      select(i, ev) {
        const { selection, lastIndex } = get();

        let nextSelection = new Set(selection);

        if (ev.shiftKey) {
          for (
            let k = Math.min(lastIndex, i);
            k <= Math.max(lastIndex, i);
            k++
          ) {
            nextSelection.add(k);
          }
        } else if (ev.ctrlKey) {
          nextSelection.has(i) ? nextSelection.delete(i) : nextSelection.add(i);
        } else {
          nextSelection = new Set([i]);
        }

        set({
          lastIndex: i,
          selection: new Set([...nextSelection].sort()),
        });
      },

      selectAll() {
        set({
          lastIndex: 0,
          selection: new Set(Array(getSize.current()).keys()),
        });
      },

      selectNone() {
        set({
          lastIndex: 0,
          selection: new Set(),
        });
      },
    };
  });

  return state as ItemsSelector;
}
