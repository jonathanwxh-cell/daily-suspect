import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://daily-suspect.vercel.app"),
  title: "Daily Suspect — Make them talk.",
  description:
    "An AI interrogation game. One suspect, a handful of questions, one hidden truth. Hit their pressure points, break their composure, get the confession.",
  openGraph: {
    title: "Daily Suspect",
    description: "How few questions does it take you to break a suspect?",
    images: ["/media/elena.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#14120f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Special+Elite&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
