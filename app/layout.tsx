import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto");
  const protocol = forwardedProtocol ?? (host?.startsWith("localhost") ? "http" : "https");
  const siteUrl = new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? `${protocol}://${host ?? "localhost:3000"}`,
  );

  return {
    metadataBase: siteUrl,
    title: {
      default: "AI 技术时空图谱",
      template: "%s · AI 技术时空图谱",
    },
    description:
      "一份以证据为底座，梳理 AI 模型训练、推理技术、近期趋势与长期未来的可交互时间图谱。",
    keywords: [
      "AI history",
      "AI trends",
      "AI future",
      "LLM",
      "multimodal models",
      "inference",
    ],
    openGraph: {
      type: "website",
      locale: "zh_CN",
      url: siteUrl,
      siteName: "AI 技术时空图谱",
      title: "AI 技术时空图谱",
      description: "历史可核验，趋势可修订，未来有边界。",
      images: [
        {
          url: "/og.png",
          alt: "AI 技术时空图谱：历史、趋势、未来",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "AI 技术时空图谱",
      description: "历史可核验，趋势可修订，未来有边界。",
      images: ["/og.png"],
    },
  };
}

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
