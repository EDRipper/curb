import type { Metadata, Viewport } from "next";
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

const title = "curb — ship an accessibility fix, prove it with numbers";
const description =
  "A Hack Club YSWS: fix real web accessibility issues, prove the improvement with an automated audit score delta, get assistive/adaptive tech gear.";

export const metadata: Metadata = {
  metadataBase: new URL("https://curb-theta.vercel.app"),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: "https://curb-theta.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#fdfaf3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
