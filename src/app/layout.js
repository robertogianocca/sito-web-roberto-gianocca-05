import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased lg:h-dvh`}
    >
      <body className="flex min-h-full flex-col font-sans lg:h-dvh lg:min-h-0 lg:overflow-hidden">
        {children}
      </body>
    </html>
  );
}
