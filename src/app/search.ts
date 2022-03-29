import { atom, runInFlow, g, deepReadonly } from "@dhmk/atom";
import {
  DomainError,
  snakeToCamelCase,
  camelToSnakeCase,
  objectTransform,
  flowChain,
} from "@dhmk/utils";

import createSettings from "./settings";

export default () => {
  const settings = createSettings();

  function get(path) {
    const headers = {
      Authorization: "Basic " + btoa(settings().shutterstock),
      "Accept-Language": "en",
    };

    return fetch("https://api.shutterstock.com/v2" + path, {
      headers,
    }).then(async (r) => {
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    });
  }

  const chain = flowChain();

  const self = {
    categories: atom<ReadonlyArray<any>>([]),

    busy: atom(false),
    items: atom<ReadonlyArray<any>>([]),
    totalItems: atom(0),

    search: (request) =>
      chain(() =>
        runInFlow(function* () {
          try {
            self.busy.set(true);

            const params = camelToSnakeCase({
              view: "full",
              perPage: 10,
              ...objectTransform(request, (v, k) => (v ? [k, v] : null)),
            });

            const { data, totalCount } = yield* g(
              get("/images/search?" + new URLSearchParams(params)).then(
                snakeToCamelCase
              )
            );

            self.items.set(data);
            self.totalItems.set(totalCount);
          } catch (e: any) {
            throw new DomainError(self, e);
          } finally {
            self.busy.set(false);
          }
        })
      ),
  };

  get("/images/categories")
    .then(({ data }) => data.filter((x) => !/^[-A-Z]+$/.test(x.name)))
    .catch(() => [])
    .then((x) => self.categories.set(x));

  return deepReadonly(self);
};
