import { dirname } from "path";
import { cpus } from "os";
import { disposable, priorityQueue, pLimited } from "@dhmk/utils";
import { observe, untracked } from "@dhmk/atom";

import * as exiftool from "./exiftool";
import createSettings from "./settings";
import createImage from "./image";
import createMetadata from "./metadata";
import createGallery from "./gallery";
import createKeywording from "./keywording";

export default function () {
  const settings = createSettings();

  const priQ = priorityQueue(pLimited<any>((fn) => fn(), cpus().length));

  // prettier-ignore
  const exiftoolService = {
    read(path, shape) {
      return priQ(() => exiftool.read({ path, shape, exiftool: settings().exiftool }))
    },

    write(path, shape, values) {
      return priQ(() => exiftool.write({ path, shape, values, exiftool: settings().exiftool }))
    },
  };

  // prettier-ignore
  const metadataService = {
    read(path) {
      return priQ(() => exiftool.read({ path, shape: metadata.shape, exiftool: settings().exiftool }), -1);
    },
  };

  const image = createImage();
  const metadata = createMetadata(image, exiftoolService);
  const gallery = createGallery(metadataService);
  const keywording = createKeywording(image, settings);

  // effects

  const { lastFile } = settings();
  lastFile && image.load(lastFile);

  const dispose = disposable(
    observe(({ isInitial }) => {
      if (image.path()) {
        !isInitial && settings.set({ lastFile: image.path() });
        metadata.load();
      }
    }),

    observe(() => {
      const dir = dirname(image.path() || ".");
      untracked(() => {
        if (gallery.directory() !== dir) gallery.setDirectory(dir);
      });
    })
  );

  // end effects

  return {
    image,
    metadata,
    gallery,
    keywording,
    settings,
    dispose,
  };
}
