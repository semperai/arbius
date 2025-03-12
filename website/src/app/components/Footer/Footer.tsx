'use client';
import React from 'react';
import { StaticImageData } from 'next/image';
import github from '@/app/assets/images/github.png';
import discord from '@/app/assets/images/discord.png';
import telegram from '@/app/assets/images/telegram.png';
import twitter from '@/app/assets/images/twitter.png';
import Image from 'next/image';
import Link from 'next/link';
import { Fade } from 'react-awesome-reveal';
import arbius_logo from '@/app/assets/images/arbius_logo.png';
import small_arrow from '@/app/assets/images/small_arrow.png';

type FooterLink = {
  name: string;
  link: string;
  id: number;
};

const footerLinks: FooterLink[] = [
  /*
  {
    name: "Generate",
    link: "/generate"
  },
  */
  {
    name: 'Upgrade',
    link: '/upgrade',
  },
  {
    name: 'Media',
    link: '/media',
  },
  // {
  //   name: "Staking",
  //   link: "https://app.gysr.io/pool/0xf0148b59d7f31084fb22ff969321fdfafa600c02?network=ethereum"
  // }, //commenting for mobile footer
  {
    name: 'Docs',
    link: 'https://docs.arbius.ai/',
  },
  {
    name: 'Models',
    link: '/models',
  },
  {
    name: 'Explorer',
    link: '/explorer',
  },
  {
    name: 'Blog',
    link: 'https://blog.arbius.ai/',
  },
  /*{
    name: 'GYSR',
    link: 'https://app.gysr.io/pool/0xf0148b59d7f31084fb22ff969321fdfafa600c02?network=ethereum',
  },*/
  {
    name: 'veAIUS',
    link: '/aius',
  },
  {
    name: "Arbitrum Bridge",
    link: "https://bridge.arbitrum.io/"
  }
].map((o, id) => ({ ...o, id }));

type SocialIcon = {
  image: StaticImageData;
  link: string;
  alt: string;
  id: number;
};

const socialIcons: SocialIcon[] = [
  {
    image: github,
    link: 'https://github.com/semperai/arbius',
    alt: 'Github',
  },
  {
    image: twitter,
    link: 'https://x.com/arbius_ai',
    alt: 'X',
  },
  {
    image: telegram,
    link: 'https://t.me/arbius_ai',
    alt: 'Telegram',
  },
  {
    image: discord,
    link: 'https://discord.com/invite/eXxXMRCMzZ',
    alt: 'Discord',
  },
].map((o, id) => ({ ...o, id }));

function FLink(link: FooterLink) {
  return (
    <Link href={link.link} target='_blank' key={link.id}>
      <div>
        <p className='lato-regular text-right text-[16px] font-medium text-[#393939] hover:text-purple-text'>
          {link.name}
        </p>
      </div>
    </Link>
  );
}

export default function Footer() {
  const scrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className='bg-white-background py-8 lg:py-20'>
      <div className="fixed bottom-0 h-[80px] w-full bg-black-background flex flex-col items-center justify-center z-[9999]">
        <div className="text-[14px] text-original-white">Rewards are paused until further notice!</div>
      </div>
      <div className='mx-auto w-mobile-section-width max-w-center-width lg:w-section-width'>
        <Fade direction='up' triggerOnce={true}>
          <div className='hidden lg:block'>
            <div className='mb-10 flex justify-between'>
              <div>
                <div>
                  <Link href='/'>
                    <Image
                      src={arbius_logo}
                      className='h-[40px] w-[auto]'
                      alt='arbius'
                    />
                  </Link>
                </div>
                <div className='mt-6 flex items-center gap-4'>
                  {socialIcons.map((social) => {
                    return (
                      <Link href={social.link} target='_blank' key={social.id}>
                        <div className='footer-icons-shadow group relative flex h-[50px] w-[50px] items-center justify-center rounded-xl bg-white-background'>
                          <div className='absolute left-0 z-[-10] h-[100%] w-[100%] rounded-xl bg-buy-hover opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                          <Image
                            src={social.image}
                            alt={social.alt}
                            width={20}
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
              <div>{footerLinks.slice(0, 3).map(FLink)}</div>
              <div>{footerLinks.slice(-5, -2).map(FLink)}</div>
              <div>{footerLinks.slice(-2).map(FLink)}</div>
              <div>
                <div
                  className='group flex cursor-pointer items-center gap-4'
                  onClick={scrollTop}
                >
                  <p className='lato-regular text-[14px] text-[#393939] group-hover:text-purple-text'>
                    Back to top
                  </p>
                  <Image
                    src={small_arrow}
                    className='rotate-[-90deg]'
                    alt='arrow'
                    width={8}
                  />
                </div>
              </div>
            </div>
            <div className='h-[1.5px] w-[100%] bg-[#F4F4F4]'></div>
            <div className='mt-10'>
              <p className='lato-regular text-[14px] text-copyright-text'>
                &copy; Arbius 2024
              </p>
            </div>
          </div>
          <div className='block lg:hidden'>
            <div className='flex w-[100%] flex-col justify-between'>
              <div>
                <div>
                  <Image
                    src={arbius_logo}
                    className='h-[40px] w-[auto]'
                    alt='arbius'
                  />
                </div>
                <div className='mt-6 flex items-center gap-4'>
                  {socialIcons.map((social) => {
                    return (
                      <Link href={social.link} target='_blank' key={social.id}>
                        <div className='footer-icons-shadow group relative flex h-[50px] w-[50px] items-center justify-center rounded-xl bg-white-background'>
                          <div className='absolute left-0 z-[-10] h-[100%] w-[100%] rounded-xl bg-buy-hover opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                          <Image
                            src={social.image}
                            alt={social.alt}
                            width={20}
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <div className='flex flex-row justify-between mt-6'>
                  <div className='mt-4 flex flex-col flex-wrap items-start gap-4 lm:mt-0 lm:gap-0 lg:flex-row'>
                    {footerLinks.slice(0, 4).map(FLink)}
                  </div>
                  <div className='mt-4 flex flex-col flex-wrap items-start gap-4 lm:mt-0 lm:gap-0 lg:flex-row'>
                    {footerLinks.slice(-4).map(FLink)}
                  </div>
                </div>
                <div className='mt-6'>
                  <p className='lato-regular text-[13px] text-copyright-text'>
                    &copy; Arbius 2024
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Fade>
      </div>
    </div>
  );
}
