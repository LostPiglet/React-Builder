import "../styles/global.css";

export const metadata = {
  title: "React Builder - AI 驱动的组件生成器",
  description: "使用自然语言描述，AI 为您自动生成现代化的 React 组件。支持实时预览、代码导出和响应式设计。",
  keywords: "React, AI, 组件生成器, 代码生成, Next.js, UI组件",
  authors: [{ name: "React Builder Team" }],
  robots: "index, follow",
  openGraph: {
    title: "React Builder - AI 驱动的组件生成器",
    description: "使用自然语言描述，AI 为您自动生成现代化的 React 组件",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: "React Builder - AI 驱动的组件生成器",
    description: "使用自然语言描述，AI 为您自动生成现代化的 React 组件",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6366f1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛠️</text></svg>" />
      </head>
      <body className="min-h-screen bg-gray-100 text-gray-800 antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
