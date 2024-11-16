import React, { useState } from 'react';
import { StaticImageData } from 'next/image';
import Image from 'next/image';
import small_arrow from '@/app/assets/images/small_arrow.png';

type Card = {
  id: string;
  icon: StaticImageData;
  title: string;
  content: string;
  background: string;
};

type CarouselProps = {
  cardsData: Card[];
};

export default function Carousel({ cardsData }: CarouselProps) {
  const [current, setCurrent] = useState(0);
  const length = cardsData.length;
  const nextSlide = () => {
    setCurrent(current === length - 1 ? 0 : current + 1);
  };
  const prevSlide = () => {
    setCurrent(current === 0 ? length - 1 : current - 1);
  };

  return (
    <div className='relative mt-7'>
      <div className='flex w-[100%] overflow-hidden'>
        {cardsData.map((card) => {
          return (
            <div
              className={` ${card.background} w-[100%] min-w-[100%] rounded-3xl bg-cover bg-no-repeat p-10 transition-transform duration-500 ease-in-out`}
              key={card.id}
              style={{ transform: `translate(-${current * 100}%)` }}
            >
              <div className='mb-10'>
                <Image src={card.icon} alt={card.title} width={20} />
              </div>
              <div>
                <h3 className='lato-bold text-[25px] text-card-heading'>
                  {card.title}
                </h3>
              </div>
              <div>
                <p className='lato-regular mt-6 text-[16px] text-card-heading'>
                  {card.content}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div>
        <div className='mt-6 flex items-center justify-end gap-4'>
          <div
            className='marquee-shadow flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-white-background p-4'
            onClick={prevSlide}
          >
            <Image
              className='rotate-[-180deg]'
              src={small_arrow}
              width={10}
              alt='left arrow'
            />
          </div>
          <div
            className='marquee-shadow flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-white-background p-4'
            onClick={nextSlide}
          >
            <Image src={small_arrow} width={10} alt='right arrow' />
          </div>
        </div>
      </div>
    </div>
  );
}
