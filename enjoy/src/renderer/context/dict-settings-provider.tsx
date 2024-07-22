import { createContext, useState, useEffect, useContext, useMemo } from "react";
import { AppSettingsProviderContext } from "@renderer/context";

type DictSettingProviderState = {
  dicts: DictSettingType;
  currentDictValue: string;
  currentDictName: string;
  currentDict?: DictSettingItem | undefined;
  setCurrentDictName?: (v: string) => void;
  setDefault?: (dict: DictSettingItem | null) => Promise<void>;
  add?: (dict: DictSettingItem) => Promise<void>;
  remove?: (dict: DictSettingItem) => Promise<void>;
};

const initialState: DictSettingProviderState = {
  currentDictName: "",
  currentDictValue: "camdict",
  dicts: {
    default: "",
    items: [],
  },
};

export const DictSettingProviderContext =
  createContext<DictSettingProviderState>(initialState);

export const DictSettingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [dicts, setDicts] = useState<DictSettingType>({
    default: "",
    items: [],
  });
  const [currentDictName, setCurrentDictName] = useState("");

  const currentDict = useMemo(() => {
    return dicts.items.find(
      (item) => item.name === (currentDictName || dicts.default)
    );
  }, [currentDictName, dicts]);

  const currentDictValue = useMemo(
    () => currentDictName || dicts.default || "camdict",
    [currentDictName, dicts]
  );

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = () => {
    EnjoyApp.settings.getDicts().then((res) => {
      res && setDicts(res);
    });
  };

  const setDefault = async (dict: DictSettingItem) => {
    const _dicts = { ...dicts, default: dict?.name ?? "" };

    EnjoyApp.settings.setDicts(_dicts).then(() => setDicts(_dicts));
  };

  const add = async (dict: DictSettingItem) => {
    const _dicts = {
      default: dicts.default,
      items: [...dicts.items, dict],
    };

    EnjoyApp.settings.setDicts(_dicts).then(() => setDicts(_dicts));
  };

  const remove = async (dict: DictSettingItem) => {
    const _dicts = {
      default: dicts.default,
      items: dicts.items.filter((_dict) => _dict.name !== dict.name),
    };

    if (_dicts.default === dict.name) {
      _dicts.default = "";
    }

    EnjoyApp.settings.setDicts(_dicts).then(() => setDicts(_dicts));
  };

  return (
    <DictSettingProviderContext.Provider
      value={{
        dicts,
        currentDictName,
        currentDictValue,
        currentDict,
        setCurrentDictName,
        setDefault,
        add,
        remove,
      }}
    >
      {children}
    </DictSettingProviderContext.Provider>
  );
};
