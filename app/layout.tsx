import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// distinct display face for the wordmark and hero headline only - the rest
// of the site stays on geist sans. plain geist everywhere is exactly the
// default create-next-app look; one characterful face on the two biggest
// brand moments is enough to read as designed without hurting body
// legibility.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  weight: ["700"],
  subsets: ["latin"],
});

const title = "curb — ship an accessibility fix, prove it with numbers";
const description =
  "A Hack Club YSWS: fix real web accessibility issues, prove the improvement with an automated audit score delta, get assistive/adaptive tech gear.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: SITE_URL,
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
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
