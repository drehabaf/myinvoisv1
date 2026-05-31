import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "myInvois",
  description: "Invoice and receipt generator",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ms">
      <body>{children}</body>
    </html>
  );
}
