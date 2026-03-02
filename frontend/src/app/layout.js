"use client";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import LayoutWrapper from "./LayoutWrapper";
import Script from "next/script";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "swiper/swiper-bundle.css";
import "glightbox/dist/css/glightbox.min.css";
import Loading from "./loading";

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Sincay - Mì cay chuẩn vị Hàn Quốc</title>
        <meta
          name="description"
          content="Sincay - Chuỗi nhà hàng mì cay Hàn Quốc với 7 cấp độ cay đa dạng. Trải nghiệm hương vị chuẩn Hàn ngay tại Sài Gòn."
        />
        <meta
          name="keywords"
          content="mì cay Hàn Quốc, sincay, nhà hàng Hàn Quốc, mì cay 7 cấp độ, ẩm thực Hàn Quốc"
        />

        <link href="/img/favicon.png" rel="icon" />
        <link href="/img/apple-touch-icon.png" rel="apple-touch-icon" />

        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link href="https://fonts.gstatic.com" rel="preconnect" crossOrigin="anonymous" />
      </head>
      <body>
        <Loading />
        <AuthProvider>
          <CartProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
          </CartProvider>
        </AuthProvider>

        <Script src="/vendor/bootstrap/js/bootstrap.bundle.min.js" strategy="beforeInteractive" />
        <Script src="/vendor/aos/aos.js" strategy="lazyOnload" />
        <Script src="/vendor/glightbox/js/glightbox.min.js" strategy="lazyOnload" />
        <Script src="/vendor/purecounter/purecounter_vanilla.js" strategy="lazyOnload" />
        <Script src="/vendor/swiper/swiper-bundle.min.js" strategy="lazyOnload" />
         <Script src="/js/main.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
