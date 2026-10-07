import escapeHTML from "escape-html";
import { Text, Node, BaseEditor } from "slate";
import { FileWithPayloadID, Language, OpenAIResponseData, themes } from "../types";
import { countries } from "countries-list";
import { axiosPayloadClient } from "../utils/config";

export const fileSizeToString = (sizeInBytes: number): string => {
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  let size = sizeInBytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

export const generateArrayWithNumbers = (length: number) => Array.from({ length: length + 1 }, (_, i) => i);

export const addClassToSvgString = (svgString: string, className: string) => {
  if (!svgString) return svgString;
  return svgString.replace("<svg ", `<svg class="${className}" `);
};

export const PAGE_CONFIG_BY_PATH: Record<
  string,
  {
    headerName: string;
    headerFont?: string;
    theme?: themes;
    hideHeader?: boolean;
    maxWidth?: string;
  }
> = {
  "/menu": {
    headerName: "Menu",
    theme: "printemps",
    hideHeader: true,
  },
  "/docs": {
    headerName: "Docs",
    theme: "dohaoasis-new",
    hideHeader: true,
  },
  "/employee/perks": {
    headerName: "Employee Perks",
    theme: "dohaoasis-new",
    hideHeader: true,
  },
  "/employee/whistle-blower": {
    headerName: "Whistle Blower",
    theme: "dohaoasis-new",
  },
  "/employee-benefits": {
    headerName: "Employee Benefits",
    theme: "dohaoasis-new",
    headerFont: "font-Noah-Regular",
    hideHeader: true,
    maxWidth: "max-w-lg",
  },
  "/employee": {
    headerName: "Employee Satisfaction Survey",
    theme: "dohaoasis-new",
    headerFont: "font-Noah-Regular",
  },
  "/mgmt": {
    headerName: "Employee Questionnaire for Management",
    theme: "dohaoasis",
  },
  "/survey/fnb": {
    headerName: "Survey F&B",
    theme: "printemps",
    maxWidth: "max-w-lg",
  },
  "/survey/satisfaction": {
    headerName: "Survey Satisfaction",
    theme: "printemps",
  },
  "/survey/retail": {
    headerName: "Survey Retail",
    theme: "printemps",
  },
  "/chat": {
    headerName: "Chat DO",
    theme: "dohaoasis",
  },
  "/clubprintemps": {
    headerName: "Club Printemps",
    theme: "printemps",
    hideHeader: true,
  },
  "/dohaquest/ifly-waiver": {
    headerName: "Doha Quest | iFly Waiver",
    theme: "dohaquest",
    hideHeader: true,
  },
  "/dohaquest/laser-oasis-waiver": {
    headerName: "Doha Quest | Laser Oasis Waiver",
    theme: "dohaquest",
    hideHeader: true,
  },
  "/dohaquest/roller-skating-waiver": {
    headerName: "Doha Quest | Roller Skating Waiver",
    theme: "dohaquest",
    hideHeader: true,
  },
  "/dohaquest/ski-waiver": {
    headerName: "Doha Quest | Ski Waiver",
    theme: "dohaquest",
    hideHeader: true,
  },
  "/dohaquest": {
    headerName: "Doha Quest",
    theme: "dohaquest",
    hideHeader: true,
  },
  "/survey/padel": {
    headerName: "Doha Oasis | Padel",
    theme: "dohaoasis",
  },
  "/careers/printemps": {
    headerName: "Careers | Printemps",
    theme: "printemps",
  },
  "/careers/doha-oasis": {
    headerName: "Careers | Doha Oasis",
    theme: "dohaoasis",
  },
  "/careers/dohaquest": {
    headerName: "Careers | Doha Oasis",
    theme: "dohaquest",
  },
  "/printemps/loyalty-registration": {
    headerName: "Loyalty Registration | Printemps",
    theme: "printemps",
    hideHeader: true,
    headerFont: "font-Urbanist",
  },
  "/health-check": {
    headerName: "Health Check",
    theme: "dohaoasis-new",
    hideHeader: true,
    headerFont: "font-Noah-Regular",
  },
};

const getPageConfigKeyValueByPath = (path: string) => {
  const keys = Object.keys(PAGE_CONFIG_BY_PATH);
  let keyValue = "";
  for (const keyItem of keys) {
    if (path.includes(keyItem)) {
      keyValue = keyItem;
      break;
    }
  }

  return keyValue;
};

export const getHeaderName = (path: string) => {
  if (path === "/") return "";
  const key = getPageConfigKeyValueByPath(path);
  const headerName = PAGE_CONFIG_BY_PATH[key]?.headerName || "";
  return headerName ? headerName : "";
};

export const getPageConfig = (
  path: string,
): {
  header: string;
  headerFont: string;
  theme: themes;
  hideHeader: boolean;
  maxWidth: string;
} => {
  const key = getPageConfigKeyValueByPath(path);
  const header = PAGE_CONFIG_BY_PATH[key]?.headerName || "";
  const headerFont = PAGE_CONFIG_BY_PATH[key]?.headerFont || "";
  const hideHeader = PAGE_CONFIG_BY_PATH[key]?.hideHeader || false;
  const maxWidth = PAGE_CONFIG_BY_PATH[key]?.maxWidth || "";
  let theme: themes = PAGE_CONFIG_BY_PATH[key]?.theme || "dohaoasis";

  return { header, theme, headerFont, hideHeader, maxWidth };
};

export const updateCurrentDate = (currentDate: string, newDate: string) => {
  let returnValue = new Date(currentDate);
  const dateValue = new Date(newDate);

  returnValue.setDate(dateValue.getDate());
  returnValue.setMonth(dateValue.getMonth());
  returnValue.setFullYear(dateValue.getFullYear());

  return returnValue.toISOString();
};

interface CustomTextNode {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

interface CustomLinkElement {
  type: "link";
  url: string;
  children: CustomNode[];
}

type CustomElement = {
  type: "paragraph" | "quote" | "li" | "ul" | "upload";
  value: any;
  children: CustomNode[];
};

// Define a union type that includes Text, elements, and any custom types
export type CustomNode = CustomTextNode | CustomElement | CustomLinkElement;

export const serializeRichText = (node: Node | Text): string => {
  if (Text.isText(node)) {
    let string = escapeHTML(node.text);
    if ((node as CustomTextNode).bold) {
      string = `<strong>${string}</strong>`;
    }
    return string;
  }

  const children = node.children.map((n) => serializeRichText(n as Node)).join("");

  switch ((node as BaseEditor).type) {
    case "quote":
      return `<blockquote><p>${children}</p></blockquote>`;
    case "paragraph":
      return `<p>${children}</p>`;
    case "link":
      return `<a href="${escapeHTML(node.url)}">${children}</a>`;
    case "li":
      return `<li>${children}</li>`;
    case "ul":
      return `<ul>${children}</ul>`;
    case "h6":
      return `<h6>${children}</h6>`;
    case "h5":
      return `<h5>${children}</h5>`;
    case "h4":
      return `<h4>${children}</h4>`;
    case "h3":
      return `<h3>${children}</h3>`;
    case "h2":
      return `<h2>${children}</h2>`;
    case "h1":
      return `<h1>${children}</h1>`;

    default:
      return children;
  }
};

export const updateCurrentTime = (currentDate: string, newTime: string) => {
  let returnValue = new Date(currentDate);

  const time = newTime.split(":");
  const hours = Number(time[0]);
  const mins = Number(time[1]);

  returnValue.setHours(hours, mins, 0, 0);

  return returnValue.toISOString();
};

export const getVideoInputDevices = async (): Promise<MediaDeviceInfo[]> => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === "videoinput");
  } catch (error) {
    console.error("Error enumerating devices:", error);
    return [];
  }
};

export const clearCitations = (data: OpenAIResponseData): string => {
  if (!data.content) return "";

  const content = data.content[0];
  let text = content.text.value;
  let annotations = content.text.annotations || [];
  const hasAnnotations = annotations ? annotations.length > 0 : false;

  if (hasAnnotations) {
    annotations.forEach((an) => {
      text = text.replaceAll(an.text, an.file_citation.quote ? ` #source: \`${an.file_citation.quote}\` ` : "");
    });
  }

  return `${text}`;
};

export const initDefaultLanguage = (initLang: string): Language => {
  const defaultLang: Language = "en";

  if (initLang === "en") return "en";
  if (initLang === "ar") return "ar";
  if (initLang === "fr") return "ar";

  return defaultLang;
};

export const uploadSelectedFile = async (file: FileWithPayloadID, slug: string): Promise<number | undefined> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosPayloadClient({
    method: "POST",
    data: formData,
    url: `/api/${slug}`,
  });

  const mediaResponse: number | undefined = response.data?.doc ? response.data.doc?.id : undefined;

  return mediaResponse;
};

export const getFlagEmoji = (countryCode: string): string => {
  const emoji = countryCode.toUpperCase().replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));

  return emoji;
};

export type CountryOption = {
  value: string;
  label: string;
  flag: string;
  emoji: string;
  phone: number[];
};

export const countryOptions: CountryOption[] = Object.entries(countries)
  .map(([code, country]) => ({
    value: code,
    label: country.name,
    phone: country.phone,
    emoji: getFlagEmoji(code),
    flag: `https://flagcdn.com/16x12/${code.toLowerCase()}.png`,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

export const countryOptionsWithUniquePhone: CountryOption[] = countryOptions.flatMap((country) =>
  country.phone.map((phoneCode) => ({
    ...country,
    phone: [phoneCode],
  })),
);
