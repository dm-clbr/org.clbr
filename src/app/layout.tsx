import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "../index.css";
import { Providers } from "./providers";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "CLBR Org Chart",
  description: "CLBR organizational chart app"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={manrope.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
