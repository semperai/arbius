"use client"
import React from 'react';
import Image from 'next/image';
import { Fade } from 'react-awesome-reveal';
import step1 from '../assets/images/audit_completed.png'
import arrow from '../assets/images/right_arrow.png'
import step2 from '../assets/images/aius_staking.png'
import step3 from '../assets/images/upgrade_tokenomics.png'
const posts = [
  {
    title: "Upgrade for Tokenomics",
    description: "Upgrade for Tokenomics Upgrade.",
    date: "June 5, 2024",
    image: step1
  },
  {
    title: "Audit is Completed",
    description: "Audit is Completed, for the final phase of new tokenomics.",
    date: "June 2, 2024",
    image: step2
  },
  {
    title: "AIUS Staking is in the works",
    description: "AIUS Staking is in the works.",
    date: "June 1, 2024",
    image: step3
  }
];

export default function ArbiusMedia() {
  return (
    <div className='w-[100%] h-[100%] bg-media-gradient py-20'>
      <div className="bg-gray-50 lg:p-0 w-mobile-section-width lg:w-section-width m-[auto] max-w-center-width ">
        <div className='pt-10 pb-10'>
          <div className="flex items-center lg:flex-row flex-col justify-between pb-5">
            <div className="lg:w-[70%] 2xl:w-[50%] w-[100%]">
              <div>
                  <h2 className="font-Sequel-Sans-Medium-Head lg:text-header-xl 2xl:text-header-xl text-mobile-header text-black-text mb-2 fade-container">
                      <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
                      Arbius Media
                      </Fade>
                  </h2>
              </div>
              <div>
                  <Fade direction="up" triggerOnce={true}>
                      <div className="mb-4">
                          <p className="text-subtext-three font-Sequel-Sans-Light-Body text-large-description">
                          See what’s happening across the Arbius Ecosystem.
                          </p>
                      </div>
                  </Fade>
                  
              </div>
              <button type="button" className="relative group bg-white-background border-[1px] border-original-black py-2  px-8 rounded-full flex items-center  gap-3">
                  <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-8 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <p className="relative z-10 text-original-black font-Sequel-Sans-Medium-Head group-hover:text-original-white">View more</p>
                  <Image src={arrow} width={18} className="relative z-10 filter invert group-hover:filter-none"  alt="right arrow"/>
              </button>
            </div>
                      
          </div>
          </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <div key={index}>
              <div
                id="image-parent"
                className="relative border-transparent w-[320px] h-[260px] flex justify-center items-center rounded-[50px] 2xl:m-[auto]"
              >
                <div className="relative">
                  <Image
                    className="h-[auto] w-[auto]"
                    src={post.image}
                    alt={post.title}
                    width={380}
                    height={300}
                  />
                </div>
              </div>
              <div className="py-2">
                <h2 className="text-xl font-Sequel-Sans-Medium-Head text-gray-800">{post.title}</h2>
                <p className="text-gray-400 mt-2 ">{post.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
