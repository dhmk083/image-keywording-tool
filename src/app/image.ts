import { atom, deepReadonly } from "@dhmk/atom";

export default () => {
  const self = {
    path: atom(""),

    load(path: string) {
      self.path.set(path);
    },
  };

  return deepReadonly(self);
};
