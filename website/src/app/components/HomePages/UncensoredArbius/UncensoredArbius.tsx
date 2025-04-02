'use client';
import React from 'react';
import Image from 'next/image';
import UncensoredArbiusImage from '@/app/assets/images/uncensored_arbius_image.svg';
import RightArrow from '@/app/assets/images/right_arrow.svg';

export default function UncensoredArbius(){

	return (
		<div className="text-black-text lato-regular bg-white-background bg-[url('../app/assets/images/uncensored_arbius_background.png')] bg-cover bg-no-repeat py-16 lg:py-24">
			<div className="w-[80%] m-[auto]">

				<div className="flex items-center justify-between">
					<div className="basis-[40%]">
						<div className="text-mobile-header lg:block lg:text-header font-normal">Uncensored AI Access, Powered by Arbius.</div>
						<div className="">
							Interact with and customize AI models in a free and open environment. Build without boundaries with Arbius Playground.
						</div>
						<button type='button' className='group relative flex items-center gap-3 rounded-full bg-black-background px-5 py-2 lg:px-8 mt-[20px]'>
                      		<div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-10 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                  			<div className='relative z-10 text-original-white lg:text-[100%] flex gap-[10px]'>
                    			Explore Playground <Image src={RightArrow} alt="" />
                  			</div>
                    	</button>
					</div>

					<div className="basis-[60%]">
						<Image src={UncensoredArbiusImage} alt="" />
					</div>
				</div>

			</div>
		</div>
	);

}