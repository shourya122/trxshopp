import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";

import appCss from "../styles.css?url";
import { CartProvider } from "@/lib/cart";
import { CurrencyProvider } from "@/lib/currency";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NotFound404 } from "@/components/NotFound404";
import { Toaster } from "@/components/ui/sonner";
import CookieConsent from "@/components/CookieConsent";
import { LegalModalProvider } from "@/components/legal/LegalModalProvider";
import { useCartSync } from "@/hooks/useCartSync";
import { SecurityGuard } from "@/components/SecurityGuard";


function NotFoundComponent() {
  return <NotFound404 />;
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div onClick={() => { router.invalidate(); reset(); }}>
      <NotFound404 title="OOPS!" subtitle="SOMETHING WENT WRONG" />
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        httpEquiv: "Content-Security-Policy",
        content: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.gpteng.co https://*.gstatic.com https://www.googletagmanager.com https://cdn.jsdelivr.net https://sdk.cashfree.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com",
          "font-src 'self' data: https://fonts.gstatic.com https://cdn.gpteng.co https://cdn.fontshare.com",
          "img-src 'self' data: blob: https:",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://assets.unicorn.studio https://cdn.jsdelivr.net https://www.google-analytics.com https://api.cashfree.com https://payments.cashfree.com https://sandbox.cashfree.com https://payments-test.cashfree.com",
          "frame-src 'self' https://sdk.cashfree.com https://api.cashfree.com https://payments.cashfree.com https://sandbox.cashfree.com https://payments-test.cashfree.com",
          "base-uri 'self'",
          "form-action 'self' https://api.cashfree.com https://payments.cashfree.com https://sandbox.cashfree.com https://payments-test.cashfree.com",
          "object-src 'none'",
          "upgrade-insecure-requests",
        ].join("; "),
      },
      { httpEquiv: "Referrer-Policy", content: "strict-origin-when-cross-origin" },
      { httpEquiv: "X-Content-Type-Options", content: "nosniff" },
      { name: "referrer", content: "strict-origin-when-cross-origin" },
      { title: "TRXSHOP — Game Store & Digital Marketplace" },
      { name: "description", content: "Buy Original PC, PlayStation, and Xbox games at best prices — The software and subscriptions you actually use. 100% genuine Digital Download" },
      { property: "og:title", content: "TRXSHOP — Game Store & Digital Marketplace" },
      { property: "og:description", content: "Buy Original PC, PlayStation, and Xbox games at best prices — The software and subscriptions you actually use. 100% genuine Digital Download" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "TRXSHOP — Game Store & Digital Marketplace" },
      { name: "twitter:description", content: "Buy Original PC, PlayStation, and Xbox games at best prices — The software and subscriptions you actually use. 100% genuine Digital Download" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/1e2bb937-a6dd-4eea-8c80-d8b43877e643" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/1e2bb937-a6dd-4eea-8c80-d8b43877e643" },
      { name: "google-site-verification", content: "3byZATFsV59pj8TnMzqhhkrHxH-8MDcbX5YKo69zVRc" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.cdnfonts.com/css/sf-pro-display",
      },
      {
        rel: "stylesheet",
        href: "https://api.fontshare.com/v2/css?f[]=satoshi@900&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function AnimatedOutlet() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-VKF66MNSCB"></script>
        <script dangerouslySetInnerHTML={{ __html: "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-VKF66MNSCB');" }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function CartSyncBridge() {
  useCartSync();
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { pathname } = useLocation();

  const isProductRoute = pathname.startsWith("/products/") || pathname.startsWith("/games");
  const isHomePage = pathname === "/";
  const isAdminRoute = pathname.startsWith("/admin");
  const isCheckoutRoute = pathname.startsWith("/checkout");
  const isVerifyCodeRoute = pathname.startsWith("/verify-code");
  const isSignInRoute = pathname.startsWith("/signin");
  const isAccountRoute = pathname.startsWith("/account");
  const isOrderRoute = pathname.startsWith("/order/");
  const hideChrome = isVerifyCodeRoute || isSignInRoute || isAccountRoute || isOrderRoute;
  const hideFooter = isAdminRoute || isCheckoutRoute || hideChrome;
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <CurrencyProvider>
        <LegalModalProvider>
          {!isAdminRoute && <a href="#main-content" className="skip-link">Skip to content</a>}
          <div className="relative z-10">
            {!isAdminRoute && !hideChrome && <Header />}
            <main id="main-content">
              <AnimatedOutlet />
            </main>
            {!hideFooter && <Footer hideNewsletter={!isHomePage} minimal={isProductRoute} />}
          </div>
          <Toaster position={isAdminRoute ? "top-center" : "bottom-right"} />
          {!isAdminRoute && <CookieConsent />}
          <CartSyncBridge />
          {!isAdminRoute && <SecurityGuard />}

        </LegalModalProvider>
        </CurrencyProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}
