import { setRequestLocale } from "next-intl/server";
import { StudioShell } from "@/components/studio/StudioShell";
import { logoutAction } from "../actions";

export default async function StudioAppLayout({ children, params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="h-full">
      <StudioShell locale={locale} logoutAction={logoutAction}>
        {children}
      </StudioShell>
    </div>
  );
}
