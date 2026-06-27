import type { Metadata } from "next";
import { Playfair_Display, Poppins, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { Providers } from "./providers";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

async function getLocale(): Promise<string> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get("NEXT_LOCALE")?.value ?? "en";
  } catch {
    return "en";
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();

  return {
    title: "The Fancy Faces",
    description:
      locale === "es"
        ? "The Fancy Faces Beauty Studio — Aruba. ¡Te mereces una vida fancy!"
        : "The Fancy Faces Beauty Studio — Aruba. You deserve a fancy life!",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${poppins.variable} ${playfair.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
