'use client';
import React from 'react';
import Image from 'next/image';
import AIUS_SquareLogo from '@/app/assets/images/aius_square_logo.svg';
import InferenceFees from '@/app/assets/images/inference_fees.png'
import ModelInference from '@/app/assets/images/model_inference.png'
import Link from 'next/link';
import { Fade } from 'react-awesome-reveal';

export default function AIUS(){

	return (
		<div className="text-black-text lato-regular bg-white-background bg-[url('../app/assets/images/buy_background.png')] bg-cover bg-no-repeat py-16 lg:py-24">
			<div className="w-mobile-section-width lg:w-section-width m-[auto]">
				<div className='lato-bold mb-6 text-mobile-header font-medium text-black-text lg:text-header 2xl:text-header-2xl'>
					<Image src={AIUS_SquareLogo} alt="" className="transform translate-z-0" />
		            <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
		            	veAIUS
		            </Fade>
		        </div>

				<div className="flex flex-col-reverse lg:flex-row items-start lg:items-center justify-between mt-[30px]">
					<div className="basis-[30%]">
						<div className='lato-bold text-mobile-header font-medium text-black-text lg:text-header 2xl:text-header-2xl'>
				            <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
				            	Shared
				            </Fade>
				        </div>
				        <div className='lato-bold mb-6 text-mobile-header font-medium text-black-text lg:text-header 2xl:text-header-2xl'>
				            <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
				            	Inference Fees
				            </Fade>
				        </div>
						<div className="">veAIUS stakers share in fees from AI model inferences, providing a passive income stream as the network grows.</div>

						<Link href={'/aius'} target='_blank'>
							<button type='button' className='group relative flex items-center gap-3 rounded-full bg-black-background px-8 py-2 lg:px-10 mt-[20px]'>
	                      		<div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-10 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
	                  			<div className='relative z-10 text-original-white lg:text-[100%]'>
	                    			Stake
	                  			</div>
	                    	</button>
	                    </Link>
					</div>

					<div className="basis-[50%] mb-[40px] lg:mb-0">
						<Image src={InferenceFees} alt="" />
					</div>
				</div>


				<div className="flex flex-col lg:flex-row items-center justify-between mt-[80px]">
					<div className="basis-[50%] mb-[40px] lg:mb-0">
						<Image className="" src={ModelInference} alt="" />
					</div>

					<div className="basis-[40%]">
						<div className='lato-bold text-mobile-header font-medium text-black-text lg:text-header 2xl:text-header-2xl'>
				            <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
				            	Boosting AI
				            </Fade>
				        </div>
				        <div className='lato-bold mb-6 text-mobile-header font-medium text-black-text lg:text-header 2xl:text-header-2xl'>
				            <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
				            	Model Inference
				            </Fade>
				        </div>
						<div className="">veAIUS holders can direct higher rewards to specific AI models, making those models more attractive to run.</div>
						<Link href={'/aius?section=Gauge'} target='_blank'>
							<button type='button' className='group relative flex items-center gap-3 rounded-full bg-black-background px-5 py-2 lg:px-8 mt-[20px]'>
	                      		<div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-10 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
	                  			<div className='relative z-10 text-original-white lg:text-[100%]'>
	                    			View Gauges
	                  			</div>
	                    	</button>
	                    </Link>
					</div>
				</div>

			</div>
		</div>
	);

}