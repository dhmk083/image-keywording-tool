import { flowChain, objectMap, arraysEqual, DomainError } from "@dhmk/utils";
import { atom, g, runInFlow, runInAction, deepReadonly } from "@dhmk/atom";

import * as t from "./types";

const shape = [
  {
    id: "title",
    name: "Title",
    request: "-iptc:objectName",
    response: "ObjectName",
  },
  {
    id: "description",
    name: "Description",
    request: "-iptc:caption-abstract",
    response: "Caption-Abstract",
  },
  {
    id: "keywords",
    name: "Keywords",
    request: "-iptc:keywords",
    response: "Keywords",
    multi: true,
  },
];

export default (image: t.ImageApi, exiftool: t.ExiftoolService) => {
  const _ = Symbol();
  const chain = flowChain();

  const self = {
    busy: atom(false),

    shape,

    items: Object.fromEntries(
      shape.map((x) => {
        const item = {
          id: x.id,
          multi: x.multi,

          fileValue: atom<t.MetadataValue>(x.multi ? [] : ""),

          value: atom<t.MetadataValue>(x.multi ? [] : ""),

          isSaved: atom((): boolean =>
            x.multi
              ? arraysEqual(item.fileValue() as any, item.value() as any)
              : item.fileValue() === item.value()
          ),

          setValue: (v) =>
            runInAction(() => {
              item.value.set(x.multi ? [...new Set(v)] : v);
            }),

          [_]: {
            setFileValue: (v) =>
              runInAction(() => {
                item.fileValue.set(v);
              }),
          },
        };

        return [x.id, deepReadonly(item)];
      })
    ),

    load: () =>
      chain(() =>
        runInFlow(function* () {
          let values = Object.fromEntries(
            shape.map((x) => [x.id, (x.multi ? [] : "") as t.MetadataValue])
          );

          try {
            self.busy.set(true);

            const data = yield* g(exiftool.read(image.path(), self.shape));

            values = Object.fromEntries(data.map((x) => [x.id, x.value]));
          } catch (e: any) {
            throw new DomainError(self, e);
          } finally {
            Object.entries(values).forEach(([k, v]) => {
              const item = self.items[k];
              item.setValue(v);
              item[_].setFileValue(v);
            });

            self.busy.set(false);
          }
        })
      ),

    save: () =>
      chain(() =>
        runInFlow(function* () {
          try {
            self.busy.set(true);

            const values = objectMap(self.items, (x) => x.value());
            yield exiftool.write(image.path(), self.shape, values);

            Object.entries(values).forEach(([k, v]) =>
              self.items[k][_].setFileValue(v)
            );
          } catch (e: any) {
            throw new DomainError(self, e);
          } finally {
            self.busy.set(false);
          }
        })
      ),

    isSaved: atom((): boolean =>
      Object.values(self.items).every((x) => x.isSaved())
    ),
  };

  return deepReadonly(self);
};
