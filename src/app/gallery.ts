import { resolve, join } from "path";
import { promises as fs } from "fs";
import { watch } from "chokidar";
import { debounced, throttledAsync, flowChain } from "@dhmk/utils";
import { atom, g, runInFlow, deepReadonly, keepAlive } from "@dhmk/atom";
import * as t from "./types";

export default (metadata: t.MetadataService) => {
  const chain = flowChain();

  let watcher: ReturnType<typeof watch>;

  const getMetadata = (() => {
    const cache = keepAlive(atom(() => (self.directory(), {})));

    return async (path) => {
      const currentCache = cache();
      const entry = currentCache[path] || { mtimeMs: 0 };
      const { mtimeMs } = await fs.stat(path);

      if (entry.mtimeMs < mtimeMs) {
        entry.metadata = await metadata.read(path);
        entry.mtimeMs = mtimeMs;
      }

      currentCache[path] = entry;
      return entry.metadata;
    };
  })();

  const self = {
    busy: atom(false),
    directory: atom(""),
    items: atom<any[]>([]),

    setDirectory: (path) =>
      chain(() =>
        runInFlow(function* () {
          try {
            self.busy.set(true);

            path = resolve(path);

            const dir = yield* g(fs.readdir(path, { withFileTypes: true }));

            self.directory.set(path);
            self.items.set(
              dir
                .filter((x) => x.isDirectory() || /jpe?g$/i.test(x.name))
                .map((x) => {
                  const item = {
                    isDirectory: x.isDirectory(),
                    name: x.name,
                    path: join(path, x.name),

                    metadata: (() => {
                      const a = atom<any>(undefined);

                      const update = throttledAsync(() => {
                        if (item.isDirectory) return;

                        getMetadata(item.path).then(a.set);
                      });

                      return () => {
                        update();
                        return a();
                      };
                    })(),
                  };

                  return deepReadonly(item);
                })
            );

            const refresh = debounced(() => {
              self.setDirectory(self.directory());
            }, 500);

            watcher?.close();
            watcher = watch(self.directory(), {
              ignoreInitial: true,
              depth: 0,
            }).on("all", refresh);
          } finally {
            self.busy.set(false);
          }
        })
      ),
  };

  return deepReadonly(self);
};
