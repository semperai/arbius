'use client';
import React from 'react';
import privacy from '@/app/assets/images/privacy.png';
import ai from '@/app/assets/images/ai.png';
import code from '@/app/assets/images/code.png';
import Image from 'next/image';
import { Fade } from 'react-awesome-reveal';
import Carousel from './Carousel';
export default function Democratic() {
  const cardsData = [
    {
      id: '1',
      icon: privacy,
      title: 'Decentralized AI Miners',
      content:
        'Miners are rewarded for Proof of Useful Work. Contestation ensures miner honesty, tasks are confirmed on a decentralized network and are available within seconds.',
      background: "bg-[url('../app/assets/images/secure_background.png')]",
    },
    {
      id: '2',
      icon: code,
      title: 'Direct Integration',
      content:
        "Generations done via Arbius's mining network directly outputs requests to downstream applications such as webapps, marketplaces, AI agents, chat-bots or used for gaming.",
      background: "bg-[url('../app/assets/images/integration_background.png')]",
    },
    {
      id: '3',
      icon: ai,
      title: 'DeFi AI',
      content:
        "Model creators are able to set a base fee for invocations, allowing them to monetize their creations. A portion of the revenue is also distributed to Arbius DAO's treasury and to those who hold veAIUS.",
      background: "bg-[url('../app/assets/images/ai_background.png')]",
    },
  ];
  return (
    <div className='bg-democratic-gradient py-24'>
      <div className='mx-auto w-mobile-section-width max-w-center-width lg:w-section-width'>
        <div>
          <div>
            <div>
              <h2 className='lato-bold fade-container mb-6 text-mobile-header text-black-text lg:text-header 2xl:text-header-2xl'>
                <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
                  We dream of open and accessible AI
                </Fade>
              </h2>
              <Fade direction='up' triggerOnce={true}>
                <p className='lato-regular w-[100%] text-para text-subtext-three lg:w-[70%]'>
                  Arbius is controlled by its users, not monopolized by large
                  corporations and governments. The design of Arbius makes it
                  difficult or impossible to censor usage, allowing for anyone
                  in the world to interact with AI models permissionlessly.
                </p>
                <br></br>
                <p className='lato-regular w-[100%] text-para text-subtext-three lg:w-[70%]'>
                  AI model owners can now utilize a distributed network of
                  miners and attribute request origins, ensuring high uptime and
                  integrity. By decentralizing the hosting process, Arbius
                  offers a robust foundation for building reliable and
                  transparent AI-driven applications on top of a censorship
                  resistant network.
                </p>
              </Fade>
            </div>
          </div>
          <Fade direction='up' triggerOnce={true}>
            <div>
              <div className='mt-24 hidden items-center justify-between lg:flex'>
                {cardsData.map((card) => {
                  return (
                    <div
                      className={`h-[400px] w-[30%] transform transition-all duration-500 hover:-translate-y-1 xl:h-[320px] ${card.background} rounded-3xl bg-cover bg-no-repeat p-6`}
                      key={card.id}
                    >
                      <div className='mb-10'>
                        <Image src={card.icon} alt={card.title} width={20} />
                      </div>
                      <div>
                        <h3 className='lato-bold relative z-10 text-[25px] text-card-heading'>
                          {card.title}
                        </h3>
                      </div>
                      <div>
                        <p className='lato-regular relative z-10 mt-6 text-[16px] text-card-heading'>
                          {card.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Fade>
          <div className='block lg:hidden'>
            <Carousel cardsData={cardsData} />
          </div>
        </div>
      </div>
    </div>
  );
}
