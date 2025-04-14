'use client';
import React from 'react';
import Image from 'next/image';
import UncensoredArbiusImage from '@/app/assets/images/uncensored_arbius_image.svg';
import UncensoredArbiusMobileImage from '@/app/assets/images/ai_arbius_image_mobile.svg';
import RightArrow from '@/app/assets/images/right_arrow.svg';
import Link from 'next/link';
import { Fade } from 'react-awesome-reveal';

export default function UncensoredArbius(){

	return (
		<div className="text-black-text lato-regular bg-white-background bg-[url('../app/assets/images/uncensored_arbius_background.png')] bg-cover bg-no-repeat py-16 lg:py-24">
			<div className="w-mobile-section-width lg:w-section-width m-[auto]">

				<div className="flex flex-col lg:flex-row items-center justify-between">
					<div className="basis-[40%]">
						<div className='hidden lg:block lato-bold text-mobile-header font-medium text-black-text lg:text-header 2xl:text-header-2xl'>
				            <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
				            	Uncensored AI Access,
				            </Fade>
				        </div>
						<div className='hidden lg:block lato-bold mb-6 text-mobile-header font-medium text-black-text lg:text-header 2xl:text-header-2xl'>
				            <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
				            	Powered by Arbius.
				            </Fade>
				        </div>
				        <div className='lato-bold fade-container mb-6 text-mobile-header leading-[50px] text-black-text lg:hidden lg:leading-none lato-bold'>
				            <Fade delay={0.1} cascade damping={0.1} triggerOnce={true} duration={400}>
				            	Uncensored AI Access, Powered by Arbius.
				            </Fade>
				        </div>
						<div className="">
							Interact with and customize AI models in a free and open environment. Build without boundaries with Arbius Playground.
						</div>
						<Link href={'https://arbiusplayground.com'} target='_blank'>
							<button type='button' className='group relative flex items-center gap-3 rounded-full bg-black-background px-5 py-2 lg:px-8 mt-[20px]'>
	                      		<div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-10 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
	                  			<div className='relative z-10 text-original-white lg:text-[100%] flex gap-[10px]'>
	                    			Explore Playground <Image src={RightArrow} alt="" />
	                  			</div>
	                    	</button>
	                    </Link>
					</div>

					<div className="hidden lg:block basis-[60%]">
						<Image src={UncensoredArbiusImage} alt="" />
					</div>
					<div className="self-start mt-[50px] lg:hidden">
						<Image src={UncensoredArbiusMobileImage} alt="" />
					</div>
				</div>

			</div>
		</div>
	);

}