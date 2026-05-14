import { Geist_Mono, Roboto } from "next/font/google";
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

export const metadata = {
  title: "Roberto Gianocca",
  description: "Portfolio e progetti creativi.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="it"
      className={`${roboto.variable} ${geistMono.variable} h-full antialiased lg:h-dvh`}
    >
      <body className="flex min-h-full flex-col font-sans text-base lg:h-dvh lg:min-h-0 lg:overflow-hidden">
        {children}
      </body>
    </html>
  );
}
