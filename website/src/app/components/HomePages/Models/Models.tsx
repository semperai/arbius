'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { StaticImageData } from "next/image"
import amica from '../../../assets/images/amica.png';
import generativeAI from '../../../assets/images/ai_generation.png';
import marketplace from '../../../assets/images/marketplace.png';
import amica_mobile from '../../../assets/images/amica_mobile.png';
import generativeAI_mobile from '../../../assets/images/ai_generation_mobile.png';
import marketplace_mobile from '../../../assets/images/marketplace_mobile.png';
import NextImage from 'next/image';
import right_arrow from '../../../assets/images/arrow.png';
import arbius_logo_round from '../../../assets/images/arbius_logo_round.png';
import { Fade } from 'react-awesome-reveal';
import Link from 'next/link';

type Model = {
  text: string;
  image: StaticImageData;
  mobile_image: StaticImageData;
  background: string;
  link?: string;
};

const AllModels: Record<string, Model> = {
  'Generative AI': {
    text: 'Be part of the burgeoning AI economy! Users can now share in the value generated from AI, and model creators are now able to monetize their creations, or choose to host them free of cost. Our generative AI is handled by a global decentralized network of accelerated compute solvers.',
    image: generativeAI,
    mobile_image: generativeAI_mobile,
    background: 'bg-ai-gradient',
  },
  Amica: {
    text: 'Amica is an open source AI persona chatbot interface that provides emotion, bi-directional text to speech, audial interpretation, and visual recognition based interactions.',
    image: amica,
    mobile_image: amica_mobile,
    background: 'bg-ai-gradient',
    link: 'https://amica.arbius.ai/',
  },
  Marketplace: {
    text: 'Arbius has created a one of a kind ecosystem where agents for the first time can source their own compute. True autonomy starts here! Utilizing decentralized escrow, fully autonomous agents can earn as well as purchase services from other agents and humans alike.',
    image: marketplace,
    mobile_image: marketplace_mobile,
    background: 'bg-ai-gradient',
  },
};

export default function Models() {
  const [selectedModel, setSelectedModel] = useState('Generative AI');
  const [stopEffect, setStopEffect] = useState(false);
  const [opacity, setOpacity] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [index, setActiveIndex] = useState(0);
  const [modelFadeIn, setModelFadeIn] = useState(true);
  const imageParentRef = useRef<HTMLDivElement>(null);
  const [background, setBackground] = useState(
    AllModels['Generative AI'].background
  );
  const toggleBackground = (add: boolean) => {
    if (add) {
      imageParentRef.current?.classList.add('model-image-gradient');
    } else {
      imageParentRef.current?.classList.remove('model-image-gradient');
    }
  };

  const renderModel = (key: string, index: number) => {
    setStopEffect(false);
    setModelFadeIn(false);
    setOpacity(false);
    setCurrentImageIndex(index);
    setTimeout(() => {
      setModelFadeIn(true);
      setOpacity(true);
      setStopEffect(true);
      setSelectedModel(key);
    }, 500);
    setBackground(AllModels[key].background);
  };

  useEffect(() => {
    let AllModelNames = Object.keys(AllModels);
    const interval = setInterval(() => {
      let currentIndex = index + 1;

      if (currentIndex > 2) {
        currentIndex = 0;
      }
      if (!stopEffect) {
        setActiveIndex(currentIndex);
        setSelectedModel(AllModelNames[currentIndex]);
        setModelFadeIn(true);
        setCurrentImageIndex(currentIndex);
      }
    }, 20000);
    return () => {
      clearInterval(interval);
    };
  }, [index, stopEffect, AllModels]);

  useEffect(() => {
    if (modelFadeIn && !stopEffect) {
      const timer = setTimeout(() => {
        setModelFadeIn(false);
      }, 19500);

      return () => clearTimeout(timer);
    }
  }, [modelFadeIn]);

  return (
    <div
      className={`bg-democratic-gradient lg:${background} lato-bold bg-cover`}
    >
      <div className='m-[auto] flex w-mobile-section-width max-w-center-width flex-col items-center justify-between py-24 lg:w-section-width lg:flex-row'>
        <div className='w-full lg:w-[50%]'>
          <div className='Gradient-transparent-text mb-2 bg-button-gradient-txt text-[16px] lg:mb-0 lg:text-[12px]'>
            Multi-Model Economy!
          </div>
          <div className='lato-bold mb-6 text-mobile-header font-medium text-black-text lg:text-header 2xl:text-header-2xl'>
            <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
              DeFi for AI
            </Fade>
          </div>
          <Fade direction='up' triggerOnce={true}>
            <div>
              <div className='lato-regular text-para text-subtext-two'>
                OSS (open source software) models such as Llama 3 and others can
                now be part of a shared AI economy for all. Arbius handles
                accelerated compute matchmaking for each request, pairing the
                best solvers to each task for rewards. Through its utility,
                ecosystem participants can steer the economy and share in the
                value generated from&nbsp;AI.&nbsp;
              </div>
            </div>
          </Fade>
          <Fade direction='up' triggerOnce={true} className='hidden lg:block'>
            <div className='mt-[30px]'>
              <div className='all-models model-items flex w-full justify-between'>
                {Object.keys(AllModels).map(function (item, index) {
                  return (
                    <div
                      className={` ${selectedModel === item ? 'selected' : 'non-selected'} hover:text-purple-text`}
                      onClick={() => {
                        renderModel(item, index);
                      }}
                      key={index}
                    >
                      {item}
                    </div>
                  );
                })}
              </div>
              <Fade direction='up' triggerOnce={true}>
                <div className='mt-[30px]'>
                  <div
                    className={`{/*Gradient-transparent-text bg-background-gradient-txt*/} model-container text-[28px] font-medium text-blue-text ${modelFadeIn || stopEffect ? 'fade-in' : ''} ${opacity ? '!opacity-100' : 'opacity-0'}`}
                  >
                    {selectedModel}
                  </div>
                  <div
                    className={`lato-regular model-container mt-[10px] w-[80%] text-subtext-two lg:h-[180px] ${modelFadeIn || stopEffect ? 'fade-in' : ''} ${opacity ? '!opacity-100' : 'opacity-0'}`}
                  >
                    {AllModels[selectedModel].text}

                    <div>
                      {AllModels[selectedModel].link && (
                        <Link href={'https://amica.arbius.ai/'} target='_blank'>
                          <button
                            type='button'
                            className={`model-container group relative mt-[20px] flex items-center gap-3 overflow-hidden rounded-full bg-black-background px-8 py-2 ${modelFadeIn || stopEffect || opacity ? 'fade-in' : ''}`}
                          >
                            <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-8 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                            <div className='lato-bold relative z-10 text-original-white'>
                              Try now
                            </div>
                            <NextImage
                              src={right_arrow}
                              width={18}
                              className='relative z-10'
                              alt='right arrow'
                            />
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </Fade>
            </div>
          </Fade>
        </div>

        <Fade direction='up' triggerOnce={true} className='lg:block lg:w-[50%]'>
          <div className=''>
            {/*"xl:ml-[20%]"*/}
            <div
              ref={imageParentRef}
              className={`relative ml-[auto] hidden h-[500px] w-[320px] items-center justify-center rounded-[50px] border-[transparent] lg:flex`}
            >
              {Object.keys(AllModels).map((model, index) => (
                <NextImage
                  key={index}
                  className={`absolute left-0 top-0 h-[500px] w-[auto] transition-opacity duration-500 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                  src={AllModels[model].image}
                  alt=''
                  priority
                  onMouseOver={() => toggleBackground(true)}
                  onMouseOut={() => toggleBackground(false)}
                />
              ))}
              <span className='absolute right-[20px] top-[20px] hidden rounded-[20px] p-[10px_25px] text-[11px] text-[white] backdrop-blur'>
                Generated by kandinsky 2
              </span>
              <span className='absolute bottom-[20px] right-[20px]'>
                <NextImage
                  className='h-[50px] w-[auto]'
                  src={arbius_logo_round}
                  alt=''
                />
              </span>
            </div>
          </div>
        </Fade>
        {/* Mobile View starts here */}
        <div className='mt-8 block lg:hidden'>
          {Object.keys(AllModels).map((item, key) => {
            return (
              <div
                key={key}
                className={
                  key === Object.keys(AllModels).length - 1 ? '' : 'mb-[4rem]'
                }
              >
                <Fade direction='up' triggerOnce={true}>
                  <div className=''>
                    <div
                      id='image-parent'
                      className='relative flex h-[240px] w-full items-center justify-center rounded-[50px] border-[transparent]'
                    >
                      <div className='relative'>
                        <NextImage
                          className='h-[240px] w-[full] rounded-[20px] object-contain'
                          src={AllModels[item].mobile_image}
                          objectFit='contain'
                          alt=''
                          onMouseOver={() => toggleBackground(true)}
                          onMouseOut={() => toggleBackground(false)}
                        />
                      </div>
                    </div>
                  </div>
                </Fade>
                <Fade direction='up' triggerOnce={true}>
                  <div className='mt-[10px]'>
                    <div className='/*Gradient-transparent-text bg-background-gradient-txt*/ mb-4 mt-4 text-[28px] font-medium text-blue-text lg:mb-0 lg:mt-0'>
                      {item}
                    </div>
                    <div className='lato-regular mb-[10px] w-full text-subtext-two'>
                      {AllModels[item].text}
                    </div>
                    <div>
                      {AllModels[item].link && (
                        <Link href={'https://amica.arbius.ai/'} target='_blank'>
                          <button
                            type='button'
                            className='group relative mt-5 flex items-center gap-3 rounded-full bg-black-background px-8 py-2'
                          >
                            <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-8 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                            <div className='lato-bold relative z-10 text-original-white'>
                              Try now
                            </div>
                            <NextImage
                              src={right_arrow}
                              width={18}
                              className='relative z-10'
                              alt='right arrow'
                            />
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Fade>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
