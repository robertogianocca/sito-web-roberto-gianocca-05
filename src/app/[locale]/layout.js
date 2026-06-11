import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteNavBar } from "@/components/layout/SiteNavBar";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, footer, params }) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <SiteNavBar />
      <div className="flex min-h-0 flex-1 flex-col pt-(--site-nav-height)">
        {children}
      </div>
      <SiteFooter>{footer}</SiteFooter>
    </NextIntlClientProvider>
  );
}
