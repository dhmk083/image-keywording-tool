import React from "react";
import cn from "classnames";
import { observer } from "@dhmk/atom-react";

import IMG_PLACEHOLDER from "assets/img/image-placeholder.svg";
import styles from "./styles.scss";

export default observer(({ image }) => (
  <div className={styles.container}>
    <img
      src={image.path() || IMG_PLACEHOLDER}
      title={image.path()}
      className={cn(styles.image, { [styles.placeholder]: !image.path() })}
    />
  </div>
));
