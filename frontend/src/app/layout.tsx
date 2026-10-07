import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DataProvider } from "@/lib/data-context";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PWC FX",
  description: "Trading journal and analytics dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.onerror = function(msg, url, line, col, error) {
              document.body.innerHTML = '<div style="color:red;padding:20px;background:black;z-index:9999;position:fixed;top:0;left:0;right:0;bottom:0;overflow:auto;"><h1>Crash!</h1><pre>' + msg + '\\n' + (error && error.stack) + '</pre></div>';
              return false;
            };
          `
        }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-white`}>
        <DataProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto bg-zinc-950 p-8">
                <div className="max-w-7xl mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </DataProvider>
      </body>
    </html>
  );
}
