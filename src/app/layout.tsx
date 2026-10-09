import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: { default: "ProjectOS — A clearer way to work", template: "%s | ProjectOS" }, description: "ProjectOS frontend foundation. Thoughtful tools for projects, people, and decisions." };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
