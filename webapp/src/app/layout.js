import { Inter } from "next/font/google";
import "./globals.css";
import Header from '@/app/components/Header/Header'
import Footer from '@/app/components/Footer/Footer'
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Arbius",
  description: "Arbius: Decentralized Machine Learning"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header/>
        {children}
        <Footer/>
      </body>
    </html>
  );
}
