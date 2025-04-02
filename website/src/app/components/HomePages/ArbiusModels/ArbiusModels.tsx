'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import ArbiusLogoDarkBlue from '@/app/assets/images/arbius_logo_dark_blue.svg';
import BgRectModels from '@/app/assets/images/bg_rect_models.png';
import mistral_icon from '@/app/assets/images/mistral_icon.png';
import nemotron_icon from '@/app/assets/images/nemotron_icon.png';
import deepseek_icon from '@/app/assets/images/deepseek_icon.png';
import llama_icon from '@/app/assets/images/llama.png';
import search_icon from '@/app/assets/images/search_icon.png';
import qwen_icon from '@/app/assets/images/qwen.png';
import polygon from '@/app/assets/images/polygon.png';
import github from '@/app/assets/images/github.png';

export default function ArbiusModels(){

	const [filteredData, setData] = useState([
	    {
	      model_name: 'Qwen QwQ 32b',
	      model_id: '0x89c39001e3b23d2092bd998b62f07b523d23deb55e1627048b4ed47a4a38d5cc',
	      description: 'Text Generator',
	      emissions: '40%',
	      fees: '0.01 AIUS',
	      prompts: '0',
	      icon: qwen_icon,
	      model_bytes: "0x89c39001e3b23d2092bd998b62f07b523d23deb55e1627048b4ed47a4a38d5cc"
	    },
	    {
	      model_name: 'Mistral-large-2407',
	      model_id: '0x7be59c5981953ec1fe696e16639aadc56de47330cc73af4c4bc4b758fd71a522',
	      description: 'Powerful, versatile, coherent, generative, capable text generator.',
	      emissions: '40%',
	      fees: '0.01 AIUS',
	      prompts: '40,304',
	      icon: mistral_icon,
	      model_bytes: "0x7be59c5981953ec1fe696e16639aadc56de47330cc73af4c4bc4b758fd71a522"
	    },
	    {
	      model_name: 'Nemotron-4-340b',
	      model_id: '0x4baca32105739de16cf826b6cdea4cd1d7086af40efafb1742d3b637ab703a1f',
	      description: 'Sophisticated, imaginative and efficient text generator',
	      emissions: '40%',
	      fees: '0.01 AIUS',
	      prompts: '38,994',
	      icon: nemotron_icon,
	      model_bytes: "0x4baca32105739de16cf826b6cdea4cd1d7086af40efafb1742d3b637ab703a1f"
	    },
	    {
	      model_name: 'Llama-3.1-405b',
	      model_id: '0x6c7442f4cf999d9cb907458701b6c0dc2bb9eff10bfe20add82a9917ea955a64',
	      description: 'Text generator with contextually aware, strong reasoning',
	      emissions: '40%',
	      fees: '0.01 AIUS',
	      prompts: '32,945',
	      icon: llama_icon,
	      model_bytes: "0x6c7442f4cf999d9cb907458701b6c0dc2bb9eff10bfe20add82a9917ea955a64"
	    },
	    {
	      model_name: 'Deepseek-coder-v2',
	      model_id: '0x3aa70902b29c08238a3a287f14907f4b752c9a18d69fa08822937f2ca8d63e21',
	      description: 'Efficient, precise, versatile, robust, generative code generator.',
	      emissions: '40%',
	      fees: '0.01 AIUS',
	      prompts: '6049',
	      icon: deepseek_icon,
	      model_bytes: "0x3aa70902b29c08238a3a287f14907f4b752c9a18d69fa08822937f2ca8d63e21"
	    },
	   	{
	      model_name: 'Llama-3.1-80b',
	      model_id: '0x4f4999001f7a0012ee8d2c41643f84ce25055aaacfb0b7134c8a572faffc13ca',
	      description: 'Large, capable language model.',
	      emissions: '40%',
	      fees: '0.01 AIUS',
	      prompts: '10,203',
	      icon: llama_icon,
	      model_bytes: "0x4f4999001f7a0012ee8d2c41643f84ce25055aaacfb0b7134c8a572faffc13ca"
	    },
	    // {
	    //   model_name: 'Qwen',
	    //   model_id: '0x7cd06b3facb05c072fb359904a7381e8f28218f410830f85018f3922621ed33a',
	    //   description: 'Text Generator',
	    //   emissions: '0%',
	    //   fees: '0',
	    //   prompts: '6049',
	    //   icon: qwen_icon,
	    //   model_bytes: "0x7cd06b3facb05c072fb359904a7381e8f28218f410830f85018f3922621ed33a"
	    // }
	  ]);

	return (
		<div className="arbius-models-background py-16 lato-regular">
			<div className="w-[70%] m-[auto]">
				<div className="flex justify-between">
					<div className="basis-[45%]">
						<div className="flex items-center gap-[15px]">
							<div className="font-semibold text-black-text text-mobile-header lg:text-header 2xl:text-header-2xl">Arbius Models</div>
							<Image src={ArbiusLogoDarkBlue} alt="" />
						</div>
						<div className="text-black-text mt-[10px] text-para text-subtext-one">Explore the advanced AI models of Arbius, a decentralized machine learning network powered by AIUS and Proof-of-Useful-Work (PoUW).</div>
						<div className="flex gap-[20px] items-center mt-[20px]">
							<button type='button' className='group relative flex items-center gap-3 rounded-full bg-black-background px-5 py-2 lg:px-8'>
                      			<div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-10 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                  				<div className='relative z-10 text-original-white lg:text-[100%]'>
                    				Visit Playground
                  				</div>
                    		</button>

                    		<button type='button' className='group relative flex items-center gap-3 rounded-full bg-black-background px-5 py-2 lg:px-8'>
                      			<div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-10 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                  				<div className='relative z-10 text-original-white lg:text-[100%]'>
                    				Amica
                  				</div>
                    		</button>
						</div>
					</div>
					<div className="basis-[40%]">
						<Image src={BgRectModels} alt="" />
					</div>
				</div>

				<div className='w-full overflow-x-auto xl:overflow-x-visible text-black-text mt-[25px]'>
					<div className="flex">
						<div className='stake-box-shadow flex h-auto items-center justify-between rounded-[15px] bg-white-background px-2 pr-3'>
				          <input
				            placeholder='Search Model name or ID'
				            className='h-full w-[250px] border-0 bg-transparent px-3 py-4 focus:outline-none placeholder-[#B0B0B0]'
				          />
				          <Image src={search_icon} className='h-4 w-4' />
				        </div>

				        <div>
				        </div>
				    </div>

			        <div className='text-[13px] md:text-[16px] gauge-table-headings mb-4 mt-2 flex min-w-[700px] md:min-w-[1000px] items-center justify-between gap-4 md:gap-8 rounded-lg bg-white-background px-5 pb-2 pt-2 font-normal lg:px-10 border-gradient'>
			          <div className='w-[20%]'>
			            <h1>Model Name</h1>
			          </div>
			          <div className='w-[30%]'>
			            <h1>Description</h1>
			          </div>
			          <div className='w-[15%]'>
			            <h1>Emissions</h1>
			          </div>
			          <div className='w-[15%]'>
			            <h1 className="flex items-center">Fees</h1>
			          </div>
			          <div className='w-[20%]'>
			            <h1>Repository</h1>
			          </div>
			        </div>

			        {filteredData?.map((item, key) => {
			          return (
			            <div
			              className={`gauge-table-item relative my-3 flex min-w-[700px] md:min-w-[1000px] items-center justify-between gap-4 md:gap-8 rounded-[25px] bg-white-background px-5 py-5 font-semibold lg:px-10 border-gradient`}
			              key={key}
			            >
			              <div
			                className='absolute left-[-125px] top-[10%] z-20 flex hidden items-center justify-start'
			                id={key}
			              >
			                <div className='w-[108px] w-auto rounded-xl bg-white-background p-3'>
			                  <h1 className='mb-1 text-[.6rem] text-aius-tabs-gray'>
			                    Model ID
			                  </h1>
			                  <p className='text-[.6rem]'>{item?.model_id.slice(0, 6)}...{item?.model_id.slice(-4)}</p>
			                </div>
			                <Image src={polygon} className='-ml-2' />
			              </div>
			              <div className='flex w-[20%] items-center justify-start gap-2'>
			               	<div className='hidden md:flex h-[20px] w-[20px] md:h-[28px] md:w-[28px] items-center justify-center rounded-full bg-purple-background'>
			                  <div className='relative flex h-[16px] w-[16px] items-center justify-center'>
			                    <Image
			                      src={item?.icon}
			                      fill
			                      className='h-full w-full object-contain'
			                    />
			                  </div>
			                </div>
			                <h1 className='text-[12px] md:text-[0.85rem] 2xl:text-base'>
			                  {item?.model_name}
			                </h1>
			              </div>
			              <div className='w-[30%]'>
			                <h1 className='text-[12px] md:text-[0.85rem] 2xl:text-base whitespace-normal text-[#929292] font-normal'>
			                  {item?.description}
			                </h1>
			              </div>
			              <div className='w-[15%]'>
			                <h1 className='text-[14px] md:text-[0.85rem]'>{item?.emissions}</h1>
			              </div>
			              <div className='w-[15%]'>
			                <h1 className='text-[14px] md:text-[0.85rem]'>{item?.fees}</h1>
			              </div>
			              <div className='w-[20%]'>
			                <h1 className="image-blue-filter text-[14px] md:text-[16px] flex items-center gap-1 border-b-[1px] border-[#000] w-fit cursor-pointer hover:text-blue-text hover:border-blue-text">
			                  <Image className="mt-[2px] h-[15px] w-[15px] brightness-0" src={github} alt="" /><div>Github</div>
			                </h1>
			              </div>
			            </div>
			          );
			        })}
			    </div>

			</div>
		</div>
	);
}