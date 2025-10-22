export type MenuEntryType = "page" | "system" | "anchor" | "external" | "action";

export interface MenuItem {
  title: string;
  slug: string; // peut être une URL, un #ancre, une route, ou une action id
  type: MenuEntryType;
}

export interface MenuConfig {
  menu: MenuItem[];
}

export interface PageData {
  title: string;
  accessible: boolean;
  [key: string]: any;
}


export interface PagesMap {
  [slug: string]: PageData;
}
