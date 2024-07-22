import {
  AppSettingsProviderContext,
  DictSettingProviderContext,
} from "@/renderer/context";
import { Button, toast } from "@renderer/components/ui";
import { t } from "i18next";
import {} from "path";
import { useContext } from "react";

export const DictSettings = () => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { dicts, add, remove, setDefault } = useContext(
    DictSettingProviderContext
  );

  async function handleAddDict() {
    const filePaths = await EnjoyApp.dialog.showOpenDialog({
      title: t("selectDictFile"),
      filters: [{ name: t("dictFiles"), extensions: ["mdd", "mdx", "css"] }],
      properties: ["openFile", "multiSelections"],
    });

    const path = filePaths.filter((path: string) => path.match(/\.mdx$/))[0];
    const resources = filePaths.filter((path: string) =>
      path.match(/\.(css|mdd)$/)
    );

    if (!path) {
      toast.error(t("dictFilesRequired"));
      return;
    }

    const mdx = await EnjoyApp.dict.read(path);

    if (dicts.items.find((item) => item.path === mdx.path)) {
      toast.error(t("dictFileExist", { name: mdx.name }));
      return;
    }

    await add({ ...mdx, resources });
    toast.success(t("dictFileAddSuccess", { name: mdx.name }));
  }

  async function handleRemove(dict: DictSettingItem) {
    await remove(dict);
    toast.success(t("dictFileRemoveSuccess", { name: dict.name }));
  }

  async function handleSetDefault(dict: DictSettingItem | null) {
    await setDefault(dict);
    toast.success(t("dictFileSetDefaultSuccess"));
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex justify-between pt-4 ">
          <div>
            <div className="mb-2">{t("dictionaries")}</div>
          </div>

          <Button size="sm" onClick={handleAddDict}>
            {t("import")}
          </Button>
        </div>

        <div className="flex justify-between items-center group cursor-pointer">
          <div className="flex items-center text-sm text-left h-8 hover:opacity-80">
            <span className="mr-2">{t("cambridgeDictionary")}</span>
            {!dicts.default && (
              <span className="bg-indigo-800 text-xs py-1 px-2 rounded text-opacity-80">
                {t("default")}
              </span>
            )}
          </div>
          <div className="hidden group-hover:inline-flex ">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleSetDefault(null)}
            >
              {t("setDefault")}
            </Button>
          </div>
        </div>

        {dicts.items.map((dict) => (
          <div className="flex justify-between items-center group cursor-pointer">
            <div className="flex items-center text-sm text-left h-8 hover:opacity-80">
              <span className="mr-2">{dict.title}</span>
              {dicts.default === dict.name && (
                <span className="bg-indigo-800 text-xs py-1 px-2 rounded text-opacity-80">
                  {t("default")}
                </span>
              )}
            </div>
            <div className="hidden group-hover:inline-flex ">
              <Button
                size="sm"
                variant="secondary"
                className="text-red-300 mr-2"
                onClick={() => handleRemove(dict)}
              >
                {t("remove")}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleSetDefault(dict)}
              >
                {t("setDefault")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
