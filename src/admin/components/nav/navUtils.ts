
import content from "../../../data/content.json"

export function getRouteFromPageKey(pageKey: string): string {
  return pageKey === "home" ? "/" : `/${pageKey}`;
}

export function getPageKeyFromRoute(route: string): string {
  return route === "/" ? "home" : route.replace(/^\//, "");
}

export function isPageKey(key: string): boolean {
  return key in content.pages;
}

export function throttle<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let lastCall = 0;
  return function (...args: any[]) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  } as T;
}

