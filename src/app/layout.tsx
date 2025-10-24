import type { Metadata, Viewport } from "next";
import "./globals.css";

export const runtime = 'edge';

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: "%s | GameClub - 发现精彩游戏世界",
    default: "GameClub - 发现精彩游戏世界",
  },
  description: "探索我们精心挑选的游戏集合，找到适合你的下一个游戏冒险",
  keywords: ["游戏", "在线游戏", "游戏平台", "GameClub", "免费游戏"],
  authors: [{ name: "GameClub Team" }],
  creator: "GameClub",
  publisher: "GameClub",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "GameClub - 发现精彩游戏世界",
    description: "探索我们精心挑选的游戏集合，找到适合你的下一个游戏冒险",
    url: "http://localhost:3000",
    siteName: "GameClub",
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GameClub - 发现精彩游戏世界",
    description: "探索我们精心挑选的游戏集合，找到适合你的下一个游戏冒险",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://img.gamedistribution.com" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
