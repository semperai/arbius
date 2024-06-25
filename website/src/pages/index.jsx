import React, {useEffect} from 'react';
import Homepage from "@/app/components/HomePages/Homepage";
import RootLayout from "@/app/layout";

export default function Home() {

    useEffect(() => {
        var htmlElement = document.documentElement;
        htmlElement.classList.add('bg-white-background');
    },[])

  return (
    <RootLayout>
      <main>
        <Homepage/>
      </main>
    </RootLayout>
  );
}