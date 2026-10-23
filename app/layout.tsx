import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { appContent } from "@/lib/mock/content";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: appContent.brand.name, template: `%s | ${appContent.brand.name}` },
  description: `${appContent.portal.title} powered by ${appContent.brand.name}.`,
  applicationName: appContent.brand.name,
};

export const viewport: Viewport = {
  themeColor: "#1677ff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
