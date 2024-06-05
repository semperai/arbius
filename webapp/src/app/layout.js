import "./globals.css";
import Header from '@/app/components/Header/Header'
import Footer from '@/app/components/Footer/Footer'
export const metadata = {
  title: "Arbius",
  description: "Arbius: Decentralized Machine Learning"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" as="font" href="https://res.cloudinary.com/aniket98571/raw/upload/v1717580903/Sequel-Sans-Light-Body_d83yzy.ttf" crossOrigin="anonymous"/>
        <link rel="preload" as="font" href="https://res.cloudinary.com/aniket98571/raw/upload/v1717580903/Sequel-Sans-Medium-Head_umakd5.ttf" crossOrigin="anonymous"/>
        <link rel="preload" as="font" href="https://res.cloudinary.com/aniket98571/raw/upload/v1715256918/Geist-SemiBold_h3w290.ttf" crossOrigin="anonymous"/>
        <link rel="preload" as="font" href="https://res.cloudinary.com/aniket98571/raw/upload/v1715232194/Geist-Regular_vvwe3i.ttf" crossOrigin="anonymous"/>
        <link rel="preload" as="font" href="https://res.cloudinary.com/aniket98571/raw/upload/v1717580903/AtHaussAero-Light_iwko9o.ttf" crossOrigin="anonymous"/>
      </head>
      <body>
        <Header/>
        {children}
        <Footer/>
      </body>
    </html>
  );
}
