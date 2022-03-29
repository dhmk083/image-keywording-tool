import React from "react";
import cn from "classnames";
import { join } from "path";
import { cpus } from "os";
import { remote } from "electron";
import { pLimited } from "@dhmk/utils";
import { observe } from "@dhmk/atom";
import { observer } from "@dhmk/atom-react";

import * as t from "app/types";
import { Loading, Toolbar, Title } from "components/misc";
import { useVisibilitySensor } from "hooks/visibility-sensor";
import styles from "./styles.scss";

import DIR_IMG_UP from "assets/img/up-arrow.png";
import DIR_IMG_DIR from "assets/img/folder.png";
import GAL_IMG_PLACEHOLDER from "assets/img/image-placeholder.svg";

const { nativeImage } = remote;

const DIR_UP = "..";

const UP_DIR = {
  isDirectory: true,
  name: DIR_UP,
};

const createThumbnail = pLimited(
  nativeImage.createThumbnailFromPath,
  cpus().length
);

const truncate = (s, n) => (s.length < n ? s : s.slice(0, n) + "...");

function DirectoryImage({ name }) {
  const src = name === DIR_UP ? DIR_IMG_UP : DIR_IMG_DIR;
  return <img src={src} className={styles.directoryImage} />;
}

function GalleryImage({ path, isVisible }) {
  const [src, setSrc] = React.useState(GAL_IMG_PLACEHOLDER);
  const [thumbPath, setThumbPath] = React.useState("");

  React.useEffect(() => {
    if (!isVisible || thumbPath === path) return;

    setSrc(GAL_IMG_PLACEHOLDER);

    let canceled;

    createThumbnail(path, {
      width: 100,
      height: 100,
    }).then((thumb) => {
      if (canceled) return;

      setSrc(thumb.toDataURL());
      setThumbPath(path);
    });

    return () => {
      canceled = true;
    };
  }, [path, isVisible]);

  return <img src={src} className={styles.galleryImage} />;
}

const getCaptionColor = (tags) => {
  if (!tags) return "inherit";

  const checks = tags
    .map((t) => (t.multi ? t.value.length > 10 : t.value))
    .filter(Boolean);

  return checks.length === tags.length
    ? "green"
    : checks.length === 0
    ? "crimson"
    : "goldenrod";
};

const getCaptionTitle = (name, tags) => {
  if (!tags) return name;

  return (
    name +
    "\n\n" +
    tags
      .map((t) =>
        t.multi
          ? `${t.name} (${t.value.length}): ${truncate(t.value.join(", "), 50)}`
          : `${t.name}: ${t.value}`
      )
      .join("\n")
  );
};

const GalleryItem = observer(({ item, directory, onClick, isSelected }) => {
  const { name } = item;
  const path = join(directory, name);
  const [isVisible, setIsVisible] = React.useState(false);
  const [tags, setTags] = React.useState<ReadonlyArray<any> | null>(null);

  React.useEffect(() => {
    if (item.isDirectory || !isVisible) return;

    return observe(() => setTags(item.metadata()));
  }, [item, path, isVisible]);

  const captionColor = getCaptionColor(tags);
  const captionTitle = getCaptionTitle(name, tags);

  return (
    <div
      className={cn(styles.item, {
        [styles.selected]: isSelected(path),
      })}
      onClick={() => onClick(item)}
      title={captionTitle}
      ref={useVisibilitySensor(setIsVisible)}
    >
      <div className={styles.imageContainer}>
        {item.isDirectory ? (
          <DirectoryImage name={name} />
        ) : (
          <GalleryImage path={path} isVisible={isVisible} />
        )}
      </div>
      <p className={styles.caption} style={{ color: captionColor }}>
        {name}
      </p>
    </div>
  );
});

export default observer(
  ({ gallery, image }: { gallery: t.GalleryApi; image: t.ImageApi }) => {
    const items = React.useMemo(
      () =>
        [UP_DIR]
          .concat(gallery.items())
          .sort((a, b) => +b.isDirectory - +a.isDirectory),
      [gallery.items()]
    );

    const handleItemClick = (x) => {
      const path = join(gallery.directory(), x.name);
      x.isDirectory ? gallery.setDirectory(path) : image.load(path);
    };

    const isSelected = (path) => path === image.path();

    return (
      <div className={styles.gallery}>
        <Toolbar border="bottom">
          <Title title={gallery.directory()}>{gallery.directory()}</Title>
        </Toolbar>
        <div className={styles.container}>
          {gallery.busy() && <Loading />}
          {items.map((x) => (
            <GalleryItem
              key={x.name}
              item={x}
              directory={gallery.directory()}
              onClick={handleItemClick}
              isSelected={isSelected}
            />
          ))}
        </div>
      </div>
    );
  }
);
