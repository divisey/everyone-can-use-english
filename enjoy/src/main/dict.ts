import { ipcMain } from "electron";
import { Mdict } from "js-mdict";
import path from "path";
import fs from "fs";
import { LRUCache } from "lru-cache";
import log from "@main/logger";

const logger = log.scope("dict");

export class Dict {
  private mdd: Mdict | null = null;
  private mdx: Mdict | null = null;

  private cache = new LRUCache({ max: 20 });

  read(filePath: string) {
    const mdict = new Mdict(filePath);

    return {
      path: filePath,
      name: path.basename(filePath),
      description: mdict.header.Description,
      isKeyCaseSensitive: mdict.header.KeyCaseSensitive,
      title:
        mdict.header.Title || path.basename(filePath).replace(/\.md[d|x]$/, ""),
    };
  }

  readFileAsBase64(filePath: string) {
    const cachedValue = this.cache.get(filePath);
    if (cachedValue) return cachedValue;

    try {
      const data = fs.readFileSync(filePath, { encoding: "base64" });
      this.cache.set(filePath, data);

      return data;
    } catch (err) {
      logger.error(`Failed to read file ${filePath}`, err);
      return "";
    }
  }

  findResource(key: string, resources: string[]) {
    const cachedValue = this.cache.get(key);
    if (cachedValue) return cachedValue;

    if (key.match(/\.css$/)) {
      const filePath = resources.find(
        (res) => path.basename(res) === key.replace(/^\\/g, "")
      );

      console.log("filePath", filePath, this.readFileAsBase64(filePath));

      if (filePath) return this.readFileAsBase64(filePath);
    }

    const mddPaths = resources.filter((res) => res.match(/\.mdd$/));

    mddPaths.forEach((mddPath) => {
      if (this.mdd?.fname !== mddPath) this.mdd = new Mdict(mddPath);

      const data = this.mdd.locate(key).definition;
      if (data) {
        this.cache.set(key, data);
        return data;
      }
    });

    return null;
  }

  lookup(word: string, dict: string) {
    if (this.mdx?.fname !== dict) this.mdx = new Mdict(dict);

    return this.mdx.lookup(word);
  }

  registerIpcHandlers() {
    ipcMain.handle("dict-read", async (_event, path: string) => {
      return this.read(path);
    });

    ipcMain.handle("dict-lookup", async (_event, word: string, dict: string) =>
      this.lookup(word, dict)
    );

    ipcMain.handle(
      "dict-find-resource",
      async (_event, key: string, resources: string[]) =>
        this.findResource(key, resources)
    );
  }
}

export default new Dict();
