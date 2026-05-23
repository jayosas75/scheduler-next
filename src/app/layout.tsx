
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "Scheduler - Your Personal Calendar",
  description: "Full-featured calendar with authentication and import",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            // Apply the saved accent before paint (no flash). 'auto' resolves
            // to the current weekday's color — this list MUST match
            // DAY_THEME_IDS in theme-switcher.tsx.
            __html: `try{var t=localStorage.getItem('scheduler-theme');if(t==='auto'){t=['cyan','matrix','tokyo','yellow','synth','orange','white'][new Date().getDay()];}if(t)document.documentElement.dataset.theme=t;}catch(e){}`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

