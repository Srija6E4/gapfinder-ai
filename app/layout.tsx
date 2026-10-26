
import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "GapFinder AI",
  description: "AI-powered learning gap analysis and personalized revision planning.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
