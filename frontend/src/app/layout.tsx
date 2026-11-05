import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nyaya Sahayak | न्याय सहायक — Engineering Dev Journal & Architecture Log",
  description: "A technical chronicle of building a multi-agent AI system for Indian law. Documenting our architectural decisions, challenges, and milestones from first commit to production.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full paper-surface flex flex-col selection:bg-[#9E1B1B] selection:text-[#FAF6F0]">
        {children}
      </body>
    </html>
  );
}
