import {
  AppSettingsProviderContext,
  DictSettingProviderContext,
  ThemeProvider,
} from "@/renderer/context";
import { useContext, useState, useEffect, useRef, useMemo } from "react";
import ReactShadowRoot from "react-shadow-root";
import * as cheerio from "cheerio";
import { getExtension } from "@/utils";
import { t } from "i18next";

const MIME: Record<string, string> = {
  css: "text/css",
  img: "image",
  jpg: "image/jpeg",
  png: "image/png",
  spx: "audio/x-speex",
  wav: "audio/wav",
  mp3: "audio/mp3",
  js: "text/javascript",
};

export const DictLookUpResult = (props: { word: string }) => {
  const { word } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { currentDict } = useContext(DictSettingProviderContext);
  const [result, setResult] = useState<string>("");
  const rootRef = useRef<ReactShadowRoot>(null);
  const mdx = useMemo(() => currentDict.path, [currentDict]);
  const mdd = useMemo(() => currentDict.resources[0], [currentDict]);

  async function normalizeDefinition(definition: string) {
    const $ = cheerio.load(definition, null, false);

    await Promise.all(
      $("img[src]")
        .toArray()
        .map(async (img: cheerio.Element) => {
          const $img = $(img);
          const src = $img.attr("src");
          const paths = /^file:\/\/(.*)/.exec(src);
          const key = paths ? paths[1] : src;
          const data = await readResource(key);
          const url = await createUrl(MIME["img"], data);

          $img.attr("src", url).attr("_src", src);
        })
    );

    await Promise.all(
      $("link[rel=stylesheet]")
        .toArray()
        .map(async (link: cheerio.Element) => {
          const $link = $(link);
          const data = await readResource($link.attr("href"));
          const url = await createUrl(MIME["css"], data);

          $link.replaceWith(
            $("<style scoped>").text('@import url("' + url + '")')
          );
        })
    );

    await Promise.all(
      $('a[href^="sound://"]')
        .toArray()
        .map(async (link: cheerio.Element) => {
          const $link = $(link);
          const href = $link.attr("_href") || $link.attr("href").substring(8);

          $link.attr("data-type", "audio").attr("data-source", href);
        })
    );

    return $.html();
  }

  async function readResource(key: string) {
    return await EnjoyApp.dict.findResource(
      "\\" + key.replace(/(^[/\\])|([/]$)/, "").replace(/\//g, "\\"),
      currentDict.resources
    );
  }

  async function createUrl(mime: string, data: string) {
    const resp = await fetch(`data:${mime};base64,${data}`);
    const blob = await resp.blob();

    return URL.createObjectURL(blob);
  }

  async function handlePlayAudio(audio: Element) {
    const sourceKey = audio.getAttribute("data-source");
    const ext: string = getExtension(sourceKey, "wav");
    const data = await readResource(sourceKey);

    console.log("audio data", data);

    if (ext === "spx") {
      // support spx
    } else {
      return createUrl(MIME[ext] || "audio", data);
    }
  }

  useEffect(() => {
    const audios = (
      rootRef.current?.shadowRoot as DocumentFragment
    )?.querySelectorAll("[data-type='audio']");

    if (!audios) return;

    audios.forEach((audio) => {
      audio.addEventListener("click", () => handlePlayAudio(audio));
    });

    return () => {
      audios.forEach((audio) => {
        audio.removeEventListener("click", () => handlePlayAudio(audio));
      });
    };
  }, [result]);

  useEffect(() => {
    if (!word) return;

    EnjoyApp.dict
      .lookup(word, mdx)
      .then((result) => {
        console.log("result", result);
        return normalizeDefinition(result.definition ?? "");
      })
      .then((result) => {
        console.log("result", result);
        return setResult(result);
      });
  }, [word, currentDict]);

  return (
    <div>
      <div className="">
        <ReactShadowRoot ref={rootRef}>
          <div dangerouslySetInnerHTML={{ __html: result }} />
        </ReactShadowRoot>
      </div>

      <div>
        {!result && (
          <div className="text-sm font-serif text-muted-foreground py-2 text-center">
            - {t("noResultsFound")} -
          </div>
        )}
      </div>
    </div>
  );
};
