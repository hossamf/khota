import type { Metadata, Viewport } from "next";
import { Cairo, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

// Authenticated platform: skip static prerender so builds never need live env.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {  title: {
    default: "خُـطَـى | KHOTA — منصة التعليم الذكية المتكاملة",
    template: "%s | خُطى KHOTA",
  },
  description:
    "منظومة تعليمية ذكية متكاملة تضم الطالب والمعلم وولي الأمر والإدارة. مسارات دراسية مخصصة، فيديوهات مركزة، اختبارات بتصحيح فوري، ومتابعة حية للإنجاز.",
  keywords: ["منصة تعليمية", "خُطى", "دروس أونلاين", "امتحانات ثانوية عامة", "EdTech", "كورسات", "مذكرات"],
  authors: [{ name: "فريق خُطى التعليمي" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      data-scroll-behavior="smooth"
      className={`h-full antialiased ${cairo.variable} ${jakarta.variable}`}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary transition-colors">
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
