import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Padhaaku",
  description: "Your study buddy that helps you understand any topic",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
