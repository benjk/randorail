export type MenuEntryType = "page" | "system" | "anchor" | "external" | "action" | "submenu";

export interface MenuItem {
  title: string;
  slug?: string;
  type: MenuEntryType;
  children?: MenuItem[];
}

export interface MenuConfig {
  menu: MenuItem[];
}

export interface PageData {
  title: string;
  accessible?: boolean;
  [key: string]: any;
}


export interface PagesMap {
  [slug: string]: PageData;
}
