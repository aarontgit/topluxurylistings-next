// /src/types/global.d.ts

export {};

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
