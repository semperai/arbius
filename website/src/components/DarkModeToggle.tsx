import { useState, useEffect } from 'react';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useTheme } from 'next-themes';
import nightwind from 'nightwind/helper';

export default function DarkModeToggle() {
  const { theme, setTheme } = useTheme();

  const [iconType, setIconType] = useState('white');

  const toggle = () => {
    nightwind.beforeTransition();

    if (theme !== 'dark') {
      setTheme('dark');
      setIconType('dark');
    } else {
      setTheme('light');
      setIconType('light');
    }
  };

  useEffect(() => {
    if (typeof theme === 'string' && iconType !== theme) {
      setIconType(theme);
    }
  }, [theme]);

  return (
    <button
      onClick={toggle}
      className='text-gray-700 focus:ring-0 focus:ring-offset-0'
    >
      {iconType !== 'dark' ? (
        <MoonIcon className='block h-6 w-6' aria-hidden='true' />
      ) : (
        <SunIcon className='block h-6 w-6' aria-hidden='true' />
      )}
    </button>
  );
}
