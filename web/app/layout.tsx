import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Permanent_Marker } from "next/font/google";
import { SvgDefs } from "@/components/svgs";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const marker = Permanent_Marker({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-marker",
});

const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "The One With the AI",
  description:
    "Chat with a Friends character — grounded in every line they ever said. Educational, non-commercial fan project.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${marker.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <SvgDefs />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
