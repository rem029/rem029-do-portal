import { BaseEditor as SlateBaseEditor, BaseText as SlateBaseText } from "slate";

declare module "slate" {
  export interface BaseText extends SlateBaseText {
    bold?: boolean;
    code?: boolean;
    italic?: boolean;
  }

  export interface BaseEditor extends SlateBaseEditor {
    type: string;
    url: string;
    newTab?: boolean;
  }
  export interface BaseElement {
    url: string;
  }
}
