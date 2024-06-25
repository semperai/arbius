import Header from '@/app/components/Header/Header'
import Footer from '@/app/components/Footer/Footer'
import {Lato} from 'next/font/google'
import Homepage from "@/app/components/HomePages/Homepage";

export const lato = Lato({
    subsets: ['latin'],
    preload:true,
    weight: ['400', '700'],
    display: 'swap',
    variable: '--font-lato',
  })
export const metadata = {
  title: "Arbius",
  description: "Arbius: Decentralized Machine Learning"
};

export default function Home() {
  return (
    <main className="bg-white-background">
      <Header />
      <Homepage/>
      <Footer />
    </main>
  );
}
