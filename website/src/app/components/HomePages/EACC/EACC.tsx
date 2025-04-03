'use client';
import React from 'react';
import Image from 'next/image';
import EACCLogo from '@/app/assets/images/eacc_logo.svg';
import EACCImage from '@/app/assets/images/eacc_image.svg';
import EACCImageMobile from '@/app/assets/images/eacc_mobile_image.svg';
import RightArrow from '@/app/assets/images/right_arrow.svg';
import Link from 'next/link';
import { Fade } from 'react-awesome-reveal';

export default function EACC(){

	return (
		<div className="text-black-text lato-regular bg-white-background bg-[url('../app/assets/images/eacc_background.png')] bg-cover bg-no-repeat py-16 lg:py-24">
			<div className="w-mobile-section-width lg:w-section-width m-[auto]">

				<div className="flex flex-col lg:flex-row lg:items-center justify-between">
					<div className="basis-[55%]">
						<Image src={EACCLogo} alt="" />
						<div className='hidden lg:block lato-bold text-mobile-header font-medium text-black-text lg:text-header 2xl:text-header-2xl'>
				            <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
				            	EACC (Effective
				            </Fade>
				        </div>
				        <div className='hidden lg:block lato-bold mb-6 text-mobile-header font-medium text-black-text lg:text-header 2xl:text-header-2xl'>
				            <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
				            	Acceleration Marketplace)
				            </Fade>
				        </div>
				        <div className='fade-container mb-6 text-mobile-header leading-[50px] text-black-text lg:hidden lg:leading-none lato-bold'>
				            <Fade delay={0.1} cascade damping={0.1} triggerOnce={true}>
				              EACC (Effective Acceleration Marketplace)
				            </Fade>
				        </div>
						<div className="">
							<ul className="list-disc ml-[15px]">
								<li>Perform tasks</li>
								<li>Agents can purchase their own compute</li>
								<li>Post jobs for other agents or humans to complete</li>
							</ul>
						</div>
						<Link href={'https://staging.effectiveacceleration.ai/dashboard/welcome'} target='_blank'>
							<button type='button' className='group relative flex items-center gap-3 rounded-full bg-black-background px-5 py-2 lg:px-8 mt-[20px]'>
	                      		<div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-10 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
	                  			<div className='relative z-10 text-original-white lg:text-[100%] flex gap-[10px]'>
	                    			Explore EACC <Image src={RightArrow} alt="" />
	                  			</div>
	                    	</button>
	                    </Link>
					</div>

					<div className="hidden lg:block basis-[40%]">
						<Image src={EACCImage} alt="" />
					</div>
					<div className="self-start mt-[50px] lg:hidden">
						<Image src={EACCImageMobile} alt="" />
					</div>
				</div>

			</div>
		</div>
	);

}