import React from "react";
import cn from "classnames";
import { observer } from "@dhmk/atom-react";
import { arraysEqual } from "@dhmk/utils";

import * as t from "app/types";
import { Loading, Input } from "components/misc";
import MultiEditor from "components/MultiEditor";
import useHints from "hooks/hints";
import styles from "./styles.scss";

type EditorProps = Readonly<{
  id: string;
  name: string;
  item: t.MetadataApi["items"][""];
}>;

const SingleEntryEditor = observer(({ id, name, item }: EditorProps) => {
  const hints = useHints(item.fileValue(), 10);
  const datalistId = id + "_suggestion";

  return (
    <div className={cn(styles.single, { [styles.notSaved]: !item.isSaved() })}>
      <span className={styles.label}>{name}: </span>
      <div>
        <Input
          className={styles.value}
          list={datalistId}
          value={item.value()}
          onChange={(ev) => item.setValue(ev.target.value)}
        />
        <datalist id={datalistId}>
          {hints.map((h) => (
            <option key={h} value={h} />
          ))}
        </datalist>
      </div>
    </div>
  );
});

const MultiEntryEditor = observer(({ name, item }: EditorProps) => {
  const [hint] = useHints(item.fileValue());
  const value = item.value() as ReadonlyArray<string>;
  const fileValue = item.fileValue() as ReadonlyArray<string>;
  const hasChanged = !arraysEqual(fileValue, value);

  return (
    <div>
      <MultiEditor
        label={name}
        value={value}
        onChange={(v) => item.setValue(v)}
        className={cn(styles.multi, { [styles.notSaved]: hasChanged })}
        labelClassName={styles.label}
        getItemClassName={(i) =>
          cn({
            [styles.itemNotSaved]: !fileValue.includes(value[i]),
          })
        }
      />
      {!!hint.length && (
        <>
          <hr />
          <p style={{ marginBottom: "0.1em" }}>Keywords suggestions:</p>
          <a
            href="#"
            onClick={(ev) => {
              ev.preventDefault();
              item.setValue(hint);
            }}
          >
            All ({hint.length}):
          </a>{" "}
          {hint.map((v) => (
            <React.Fragment key={v}>
              <a
                href="#"
                onClick={(ev) => {
                  ev.preventDefault();
                  item.setValue(value.concat(v));
                }}
              >
                {v}
              </a>{" "}
            </React.Fragment>
          ))}
        </>
      )}
    </div>
  );
});

export default observer(({ metadata }: { metadata: t.MetadataApi }) => (
  <div className={styles.container}>
    {metadata.busy() && <Loading />}
    {metadata.shape.map((shape) => {
      const item = metadata.items[shape.id];
      const Editor = item.multi ? MultiEntryEditor : SingleEntryEditor;

      return (
        <div key={shape.id}>
          <Editor id={shape.id} name={shape.name} item={item} />
        </div>
      );
    })}
  </div>
));
