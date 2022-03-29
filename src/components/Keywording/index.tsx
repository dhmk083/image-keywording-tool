import React from "react";
import { observer } from "@dhmk/atom-react";

import useAutoHeight from "hooks/auto-height";
import { Button, Textarea, Loading } from "components/misc";
import styles from "./styles.scss";

export default observer(({ keywording, onUseKeywords }) => {
  const limit =
    keywording.limit() === undefined
      ? ""
      : `(Imagga monthly limit: ${keywording.limit()})`;

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <p>Guessed keywords: {limit}</p>
        <Button
          icon="copy fas"
          title="Use keywords"
          onClick={() => onUseKeywords?.(keywording.tags())}
        />
      </div>
      <Textarea
        ref={useAutoHeight()}
        value={keywording.tags().join(", ")}
        readOnly
        className={styles.textarea}
      />
      {keywording.busy() && <Loading />}
    </div>
  );
});
