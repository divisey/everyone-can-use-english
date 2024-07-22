import { useContext, useMemo } from "react";
import { DictSettingProviderContext } from "@renderer/context";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@renderer/components/ui";
import { t } from "i18next";

export const DictSelect = () => {
  const { currentDictValue, setCurrentDictName, dicts } = useContext(
    DictSettingProviderContext
  );

  const items = useMemo(() => {
    return [
      {
        text: t("cambridgeDictionary"),
        value: "camdict",
      },
      {
        text: t("aiLookup"),
        value: "ai",
      },
      ...dicts.items.map((item) => ({
        text: item.title,
        value: item.name,
      })),
    ];
  }, [dicts]);

  return (
    <Select
      value={currentDictValue}
      onValueChange={(value: string) => setCurrentDictName(value)}
    >
      <SelectTrigger className="text-sm italic text-muted-foreground h-8">
        <SelectValue></SelectValue>
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem className="text-xs" value={item.value}>
            {item.text}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
