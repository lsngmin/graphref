import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ko", "ru", "es"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});
