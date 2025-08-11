import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MVP Sifat Chatbot",
  description: "Powered by Sifat",
  icons: {
    icon: "/sifat_logo/sifat_logo_icon_azul.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        <div className="flex h-screen bg-gray-200 w-full flex-col  text-stone-900">
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
