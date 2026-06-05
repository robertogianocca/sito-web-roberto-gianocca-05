import { Geist_Mono, Roboto } from "next/font/google";
import { getLocale } from "next-intl/server";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${roboto.variable} ${geistMono.variable} h-full antialiased lg:h-dvh`}
    >
      <body className="flex min-h-full flex-col font-sans text-base lg:h-dvh lg:min-h-0 lg:overflow-hidden">
        {children}
      </body>
    </html>
  );
}
