import type { Metadata } from "next";
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";

import "../index.css";
import Providers from "@/components/providers";

const dmSans = DM_Sans({
   variable: "--font-dm-sans",
   subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
   variable: "--font-plus-jakarta-sans",
   subsets: ["latin"],
});

export const metadata: Metadata = {
   title: "trackwise",
   description: "trackwise",
};

export default function RootLayout({
   children,
}: Readonly<{
   children: React.ReactNode;
}>) {
   return (
      <html lang="en" suppressHydrationWarning>
         <body className={`${dmSans.variable} ${plusJakartaSans.variable} antialiased`}>
            <Providers>{children}</Providers>
         </body>
      </html>
   );
}
