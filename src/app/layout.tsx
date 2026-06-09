import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/ui/toast";
import { SessionValidator } from "@/components/providers/session-validator";

const cairo = Cairo({ subsets: ["arabic", "latin"] });

export const metadata: Metadata = {
  title: "Order Management System",
  description: "نظام إدارة الطلبات والمكاتب والموظفين",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className={`${cairo.className} bg-zinc-950 text-zinc-50 antialiased min-h-screen`}>
        <AuthProvider>
          <ToastProvider>
            <SessionValidator />
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
