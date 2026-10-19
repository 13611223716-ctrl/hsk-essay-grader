import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HSK中文作文评分系统",
  description: "基于HSK（高等）评分标准的外国人中文作文自动化评分系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
