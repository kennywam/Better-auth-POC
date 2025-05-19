import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Better Auth POC",
  description: "A proof of concept for Better Auth",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`min-h-screen bg-background font-sans antialiased ${geist.className}`}
      >
        <Toaster position="top-center" richColors closeButton />
        {children}
      </body>
    </html>
  );
}
