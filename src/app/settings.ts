import Store from "electron-store";
import { atom, Atom } from "@dhmk/atom";

export default () => {
  const s = new Store({
    defaults: {
      exiftool: "exiftool",
      shutterstock: process.env.SHUTTERSTOCK_KEY || "",
      imagga: process.env.IMAGGA_KEY || "",
      lastFile: "",
    },
  });

  const a = atom({});

  const self = () => {
    a();
    return s.store;
  };

  self.set = (v: Partial<typeof s.store>) => {
    s.store = Object.assign({}, s.store, v);
    a.set({});
  };

  return self as Atom<typeof s.store> & typeof self;
};
