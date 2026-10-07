import { Language } from "../../../types";
import { RollerSkatingWaiverForm } from "../../../types/payload-types";
import { t } from "../../../utils/contents";

export const ROLLER_SKATING_PACKAGES_ITEMS = (lang: Language) => [
  {
    label: (
      <div className="flex flex-col gap-1">
        <p className="font-bold">{t("Training Only (8 sessions)", lang)}</p>
        <p className="font-normal">
          {t("QAR 399 (Juniors 4–12 or Adults 13+)", lang)}
        </p>
      </div>
    ),
    value: "package-1",
  },
  {
    label: (
      <div className="flex flex-col gap-1">
        <p className="font-bold">{t("Training + Park Admission", lang)}</p>
        <p className="font-normal">{t("QAR 799 (Adults 13+)", lang)}</p>
      </div>
    ),
    value: "package-2",
  },
  {
    label: (
      <div className="flex flex-col gap-1">
        <p className="font-bold">
          {t("Training + Park Admission (+Accompanying Guest)", lang)}
        </p>
        <p className="font-normal">
          {t(
            "QAR 1,499 (Juniors 4–12 or Adults 13 + one 18+ accompanying guest; non-transferable)",
            lang,
          )}
        </p>
      </div>
    ),
    value: "package-3",
  },
];

export const ROLLER_SKATING_CONSENT_MEDIA_APPEARANCE_ITEMS = (lang: Language) => [
  {
    label: t("Yes, I consent", lang),
    value: "yes",
  },
  {
    label: t("No, I do not consent", lang),
    value: "no",
  },
];

export const getPackageByKey = (
  language: Language,
  key?: RollerSkatingWaiverForm["packages"] | undefined,
) => {
  if (!key) return;

  return ROLLER_SKATING_PACKAGES_ITEMS(language).find((o) => o.value === key)?.label;
};

export const getConsentByKey = (
  language: Language,
  key?: RollerSkatingWaiverForm["consent_media_appearance"] | undefined,
) => {
  if (!key) return;

  return ROLLER_SKATING_CONSENT_MEDIA_APPEARANCE_ITEMS(language).find(
    (o) => o.value === key,
  )?.label;
};
