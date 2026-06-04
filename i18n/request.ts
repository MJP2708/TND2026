import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import messagesEn from "../messages/en.json";
import messagesTh from "../messages/th.json";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get("locale")?.value ?? "en";
  const locale = ["en", "th"].includes(raw) ? raw : "en";
  const messages = locale === "th" ? messagesTh : messagesEn;

  return { locale, messages };
});
