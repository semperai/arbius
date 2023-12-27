import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from "next-themes";

import LogoImg from '@/../public/logo.png';
import LogoWhiteImg from '@/../public/logo-white.png';

export default function HeaderLogo() {
  const { theme } = useTheme()

  const [logoType, setLogoType] = useState('white');

  useEffect(() => {
    if (typeof theme === 'string' && logoType !== theme) {
      setLogoType(theme);
    }
  }, [theme]);

  return (
    <Link href="/">
      {logoType !== "dark" ? (
        <Image
          className="block h-8 w-auto"
          src={LogoImg}
          alt="Arbius"
        />
      ) : (
        <Image
          className="block h-8 w-auto"
          src={LogoWhiteImg}
          alt="Arbius"
        />
      )}
    </Link>
  );
}
