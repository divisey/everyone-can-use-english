import { useEffect, useContext, useState, useMemo } from "react";
import {
  AppSettingsProviderContext,
  DictSettingProviderContext,
} from "@renderer/context";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  ScrollArea,
} from "@renderer/components/ui";
import {
  DictLookUpResult,
  DictSelect,
  CamdictLookupResult,
  AiLookupResult,
} from "@renderer/components";

export const LookupWidget = () => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { currentDictValue } = useContext(DictSettingProviderContext);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{
    word: string;
    context?: string;
    sourceType?: string;
    sourceId?: string;
    position: {
      x: number;
      y: number;
    };
  }>();

  const handleSelectionChanged = (
    _word: string,
    _context: string,
    position: { x: number; y: number }
  ) => {
    let word = _word;
    let context = _context;

    if (word) {
      if (word.indexOf(" ") > -1) return;
      setSelected({ word, context, position });
    } else {
      const selection = document.getSelection();
      if (!selection?.anchorNode?.parentElement) return;

      word = selection
        .toString()
        .trim()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]+$/, "");

      if (!word) return;
      // can only lookup single word
      if (word.indexOf(" ") > -1) return;

      context = selection?.anchorNode.parentElement
        .closest(".sentence, h2, p, div")
        ?.textContent?.trim();

      const sourceType = selection?.anchorNode.parentElement
        .closest("[data-source-type]")
        ?.getAttribute("data-source-type");
      const sourceId = selection?.anchorNode.parentElement
        .closest("[data-source-id]")
        ?.getAttribute("data-source-id");

      setSelected({ word, context, position, sourceType, sourceId });
    }

    setOpen(true);
  };

  useEffect(() => {
    EnjoyApp.onLookup((_event, selection, context, position) => {
      handleSelectionChanged(selection, context, position);
    });

    return () => EnjoyApp.offLookup();
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor
        className="absolute w-0 h-0"
        style={{
          top: selected?.position?.y,
          left: selected?.position?.x,
        }}
      ></PopoverAnchor>
      <PopoverContent
        className="w-full p-0 z-50"
        updatePositionStrategy="always"
      >
        {selected?.word && (
          <ScrollArea className="py-2 w-96 h-96 relative">
            <div className="px-4 pb-2 pt-[1px] mb-2 sticky top-0 border-b flex justify-between items-center">
              <div className="font-bold text-lg">{selected?.word}</div>
              <div className="w-40">
                <DictSelect />
              </div>
            </div>
            <div className="px-4">
              {currentDictValue === "camdict" ? (
                <CamdictLookupResult word={selected?.word} />
              ) : currentDictValue === "ai" ? (
                <AiLookupResult
                  word={selected?.word}
                  context={selected?.context}
                  sourceId={selected?.sourceId}
                  sourceType={selected?.sourceType}
                />
              ) : (
                <DictLookUpResult word={selected?.word} />
              )}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
};
