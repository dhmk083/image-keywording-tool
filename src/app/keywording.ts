import { promises as fs } from "fs";
import { atom, g, runInFlow, deepReadonly } from "@dhmk/atom";
import { DomainError, flowChain } from "@dhmk/utils";

import * as t from "./types";

export default (image: t.ImageApi, settings: t.Settings) => {
  async function getLimit() {
    const res = await fetch("https://api.imagga.com/v2/usage", {
      headers: {
        Authorization: "Basic " + btoa(settings().imagga),
      },
    });
    const j = await res.json();
    return j.result.monthly_limit - j.result.monthly_processed;
  }

  const chain = flowChain();

  const self = {
    busy: atom(false),

    tags: atom([]),
    limit: atom<number | undefined>(undefined),

    guessKeywords: () =>
      chain(() =>
        runInFlow(function* () {
          if (self.busy()) return;

          try {
            self.busy.set(true);

            const raw = yield* g(fs.readFile(image.path()));
            const blob = new Blob([raw]);
            const body = new FormData();
            body.append("image", blob);

            const res = yield* g(
              fetch("https://api.imagga.com/v2/tags", {
                method: "POST",
                headers: {
                  Authorization: "Basic " + btoa(settings().imagga),
                },
                body,
              })
            );

            const j = yield* g(res.json());
            const tags = j.result.tags.map((x) => x.tag.en);
            const limit = yield* g(getLimit());

            self.tags.set(tags);
            self.limit.set(limit);
          } catch (e: any) {
            throw new DomainError(self, e);
          } finally {
            self.busy.set(false);
          }
        })
      ),

    guessKeywordsShutter: () =>
      chain(() =>
        runInFlow(function* () {
          if (self.busy()) return;

          try {
            self.busy.set(true);

            const raw = yield* g(
              fs.readFile(image.path(), { encoding: "base64" })
            );
            const body = JSON.stringify({ base64_image: raw });
            const uploadRes = yield* g(
              fetch("https://api.shutterstock.com/v2/cv/images", {
                method: "POST",
                headers: {
                  Authorization: "Basic " + btoa(settings().shutterstock),
                  "Content-Type": "application/json",
                },
                body,
              })
            );
            const { upload_id } = yield* g(uploadRes.json());
            if (!upload_id) throw new Error("upload failed");

            const kwRes = yield* g(
              fetch(
                "https://api.shutterstock.com/v2/cv/keywords?asset_id=" +
                  upload_id,
                {
                  headers: {
                    Authorization: "Basic " + btoa(settings().shutterstock),
                  },
                }
              )
            );
            const { data } = yield* g(kwRes.json());
            self.tags.set(data);
          } catch (e: any) {
            throw new DomainError(self, e);
          } finally {
            self.busy.set(false);
          }
        })
      ),
  };

  return deepReadonly(self);
};
