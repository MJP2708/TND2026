import { LoginPage } from "@/components/app-client";

export default function Page() {
  const hasGoogle =
    Boolean(process.env.GOOGLE_CLIENT_ID) && Boolean(process.env.GOOGLE_CLIENT_SECRET);

  return <LoginPage hasGoogle={hasGoogle} />;
}
