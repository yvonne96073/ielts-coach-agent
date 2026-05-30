import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IELTS Coach Agent",
  description: "Practice IELTS writing and speaking with focused feedback.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
