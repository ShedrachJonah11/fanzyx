import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppToaster } from "@/components/AppToaster";
import { EmailVerifyManager } from "@/components/auth/EmailVerifyManager";
import { IdentityVerifyManager } from "@/components/auth/IdentityVerifyManager";
import { AuthProvider } from "@/services/context";
import { MessagingProvider } from "@/components/messaging/MessagingProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FanzyX — Your fans. Your content. Your space.",
  description:
    "A premium creator platform where fans discover creators and access exclusive content. Build your audience, publish exclusive posts, and monetize your fanbase.",
  metadataBase: new URL("https://fanzyx.app"),
  manifest: "/site.webmanifest",
  openGraph: {
    title: "FanzyX — Your fans. Your content. Your space.",
    description:
      "Discover creators you love, subscribe to exclusive content, and support the people you follow.",
    type: "website",
    images: ["/fanzyx-brand-assets/social/fanzyx-og-image-1200x630.png"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/fanzyx-brand-assets/social/fanzyx-twitter-card-1600x900.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0A0814" },
    { media: "(prefers-color-scheme: light)", color: "#FBFAFF" },
  ],
};

const themeInit = `(function(){try{var s=localStorage.getItem('fanzyx-theme');var m=window.matchMedia('(prefers-color-scheme: light)');var t=s||(m.matches?'light':'dark');document.documentElement.classList.add(t);document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t;}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head suppressHydrationWarning>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeInit }}
        />
      </head>
      <body className="min-h-full bg-app text-app flex flex-col" suppressHydrationWarning>
        <AuthProvider>
          <MessagingProvider>
            <EmailVerifyManager>
              <IdentityVerifyManager>{children}</IdentityVerifyManager>
            </EmailVerifyManager>
          </MessagingProvider>
        </AuthProvider>
        <AppToaster />
      </body>
    </html>
  );
}
