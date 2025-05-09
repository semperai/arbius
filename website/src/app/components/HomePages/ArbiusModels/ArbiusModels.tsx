'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import ArbiusLogoDarkBlue from '@/app/assets/images/arbius_logo_dark_blue.svg';
import ArbiusSquareLogoDark from '@/app/assets/images/arbius_square_logo_dark.svg';
import BgRectModels from '@/app/assets/images/bg_rect_models.png';
import mistral_icon from '@/app/assets/images/mistral_icon.png';
import nemotron_icon from '@/app/assets/images/nemotron_icon.png';
import deepseek_icon from '@/app/assets/images/deepseek_icon.png';
import llama_icon from '@/app/assets/images/llama.png';
import search_icon from '@/app/assets/images/search_icon.png';
import qwen_icon from '@/app/assets/images/qwen.png';
import polygon from '@/app/assets/images/polygon.png';
import github from '@/app/assets/images/github.png';
import nvidia from '@/app/assets/images/nvidia.svg';
import CustomDropdown from './CustomDropdown';
import { AIUS_wei } from '@/app/Utils/constantValues';
import voter from '@/app/abis/voter.json';
import engineABI from '@/app/abis/v2_enginev4.json';
import Config from '@/config.one.json';
import { AbiItem } from 'web3-utils';
import Link from 'next/link';
import { Fade } from 'react-awesome-reveal';
import { getWeb3 } from '@/app/Utils/getWeb3RPC';

export default function ArbiusModels(){

	const [searchText, setSearchText] = useState("");
	const [data, setData] = useState([
	    {
	      model_name: 'Qwen QwQ 32b',
	      model_id: '0x89c39001e3b23d2092bd998b62f07b523d23deb55e1627048b4ed47a4a38d5cc',
	      description: 'A multilingual large language model with strong reasoning and coding capabilities.',
	      emissions: '100%',
	      fees: '0.007',
	      prompts: '0',
	      icon: qwen_icon,
	      model_bytes: "0x89c39001e3b23d2092bd998b62f07b523d23deb55e1627048b4ed47a4a38d5cc"
	    },
	    {
	      model_name: 'WAI SDXL (NSFW)',
	      model_id: '0xa473c70e9d7c872ac948d20546bc79db55fa64ca325a4b229aaffddb7f86aae0',
	      description: 'Stable Diffusion XL model optimized for generation of NSFW waifu-style images.',
	      emissions: '0%',
	      fees: '0.0035',
	      prompts: '0',
	      icon: qwen_icon,
	      model_bytes: "0xa473c70e9d7c872ac948d20546bc79db55fa64ca325a4b229aaffddb7f86aae0"
	    },
	    {
	      model_name: 'M8B-uncensored',
	      model_id: "0x6cb3eed9fe3f32da1910825b98bd49d537912c99410e7a35f30add137fd3b64c",
	      description: 'Uncensored instruct model, optimized for GGUF with abliterated constraints removed.',
	      emissions: '0%',
	      fees: '0',
	      feesDollar: '0',
	      prompts: '0',
	      icon: llama_icon,
	      model_bytes: "0x6cb3eed9fe3f32da1910825b98bd49d537912c99410e7a35f30add137fd3b64c"
	    }
	]);
	const [filteredData, setFilteredData] = useState(data);
	console.log(filteredData, "DFD")
	const handleSearch = (e: any) => {
	    console.log(e.target.value);
	    setSearchText(e.target.value);
	    // debounce the function call
	    let time = setTimeout(() => {
	      setFilteredData(
	        data.filter((item) =>
	          item.model_name.toLowerCase().includes(e.target.value.toLowerCase())
	        )
	      );
	      clearTimeout(time);
	    }, 300);
	};

	useEffect(() => {

		const f1 = async () => {
		 	try{
			    const web3 = await getWeb3()

			    const voterContract = new web3.eth.Contract(
			      voter.abi as AbiItem[],
			      Config.voterAddress
			    );
			    const engineContract = new web3.eth.Contract(
			      engineABI.abi as AbiItem[],
			      Config.engineAddress
			    );

			    const _modelData = JSON.parse(JSON.stringify(data));

			    for(let i=0; i<_modelData.length; i++){
			      let a = await voterContract.methods.getGaugeMultiplier(_modelData[i]?.model_id).call()
			      _modelData[i]["emissions"] = ((Number(a) / AIUS_wei) * 100).toFixed(1).toString()+"%";

			      let b = await engineContract.methods.models(_modelData[i]?.model_bytes).call()
			      _modelData[i]["fees"] = (Number(b.fee) / AIUS_wei).toFixed(5).toString();
			    }
			    setFilteredData(_modelData);
			    setData(_modelData);

			    console.log(engineContract, "EC")

		 	}catch(e){
		    	console.log("F1 error", e)
		  	}
		}

		f1();

	}, []);


	return (
		<div className="arbius-models-background py-16 lato-regular">
			<div className="w-mobile-section-width lg:w-[70%] m-[auto]">
				<div className="flex justify-between">
					<div className="basis-[100%] lg:basis-[45%]">
						<Image className="lg:hidden" src={ArbiusSquareLogoDark} alt="" />
						<div className="flex items-center gap-[15px]">
				        	<div className='lato-bold mb-6 text-mobile-header font-medium text-black-text lg:text-header 2xl:text-header-2xl flex items-center gap-3'>
				           		<Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
				             		Arbius Models
				            	</Fade>
				            	<Image className="hidden lg:block" src={ArbiusLogoDarkBlue} alt="" />
				          	</div>
						</div>
						<Fade direction='up' triggerOnce={true}>
							<div className="text-black-text text-para text-subtext-one">Explore the advanced AI models of Arbius, a decentralized machine learning network powered by AIUS and Proof-of-Useful-Work (PoUW).</div>
						</Fade>
						<div className="flex gap-[20px] items-center mt-[20px]">
							<Link href={'https://arbiusplayground.com/'} target='_blank'>
								<button type='button' className='group relative flex items-center gap-3 rounded-full bg-black-background px-5 py-2 lg:px-8'>
	                      			<div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-10 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
	                  				<div className='relative z-10 text-original-white lg:text-[100%]'>
	                    				Visit Playground
	                  				</div>
	                    		</button>
	                    	</Link>

	                    	<Link href={'https://amica.arbius.ai/'} target='_blank'>
	                    		<button type='button' className='group relative flex items-center gap-3 rounded-full bg-black-background px-5 py-2 lg:px-8'>
	                      			<div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-10 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
	                  				<div className='relative z-10 text-original-white lg:text-[100%]'>
	                    				Amica
	                  				</div>
	                    		</button>
	                    	</Link>
						</div>
					</div>
					<div className="basis-[40%] hidden lg:block">
						<Image src={BgRectModels} alt="" />
					</div>
				</div>
				<div className="flex mt-[25px] justify-between">
						<div className='stake-box-shadow flex h-auto items-center justify-between rounded-[15px] bg-white-background px-2 pr-3'>
				          <input
				            placeholder='Search Model name or ID'
				            className='h-full w-[250px] border-0 bg-transparent px-3 py-[11px] focus:outline-none placeholder-[#B0B0B0] text-black-text'
				            value={searchText}
				            onChange={(e) => {
				              handleSearch(e);
				            }}
				          />
				          <Image src={search_icon} className='h-4 w-4' alt="" />
				        </div>

				        <div className="hidden lg:block">
				        	<CustomDropdown
				        		options={
				        			[{"name": "A100", "icon": nvidia}]
				        		}
				        		defaultValue={{"name": "Filter by: GPU"}}
				        		onChange={() => {}}
				        	/>
				        </div>
				</div>
				<div className='w-full overflow-x-auto xl:overflow-x-visible text-black-text'>

			        <div className='text-[13px] md:text-[16px] gauge-table-headings mb-4 mt-2 flex min-w-[400px] lm:min-w-[500px] lg:min-w-[1000px] items-center justify-between gap-4 md:gap-8 rounded-lg bg-white-background px-5 pb-2 pt-2 font-normal lg:px-10 border-gradient'>
			          <div className='w-[25%] lg:w-[20%]'>
			            <h1>Model Name</h1>
			          </div>
			          <div className='hidden lg:block w-[30%]'>
			            <h1>Description</h1>
			          </div>
			          <div className='w-[25%] lg:w-[15%]'>
			            <h1>Emissions</h1>
			          </div>
			          <div className='w-[25%] lg:w-[15%]'>
			            <h1 className="flex items-center">Fees</h1>
			          </div>
			          <div className='w-[25%] lg:w-[20%]'>
			            <h1>Repository</h1>
			          </div>
			        </div>

			        {filteredData?.map((item, key) => {
			          return (
			            <div
			              className={`gauge-table-item relative my-3 flex min-w-[400px] lm:min-w-[500px] lg:min-w-[1000px] items-center justify-between gap-4 md:gap-8 rounded-[25px] bg-white-background px-5 py-5 font-semibold lg:px-10 border-gradient`}
			              key={key}
			            >
			              <div
			                className='absolute left-[-125px] top-[10%] z-20 flex hidden items-center justify-start'
			                id={key.toString()}
			              >
			                <div className='w-[108px] w-auto rounded-xl bg-white-background p-3'>
			                  <h1 className='mb-1 text-[.6rem] text-aius-tabs-gray'>
			                    Model ID
			                  </h1>
			                  <p className='text-[.6rem]'>{item?.model_id.slice(0, 6)}...{item?.model_id.slice(-4)}</p>
			                </div>
			                <Image src={polygon} className='-ml-2' alt="" />
			              </div>
			              <div className='flex w-[25%] lg:w-[20%] items-center justify-start gap-2'>
			               	<div className='hidden md:flex h-[20px] w-[20px] md:h-[28px] md:w-[28px] items-center justify-center rounded-full bg-purple-background'>
			                  <div className='relative flex h-[16px] w-[16px] items-center justify-center'>
			                    <Image
			                      src={item?.icon}
			                      className='h-full w-full object-contain'
			                      alt=""
			                    />
			                  </div>
			                </div>
			                <h1 className='text-[14px] md:text-[0.85rem] 2xl:text-base'>
			                  {item?.model_name}
			                </h1>
			              </div>
			              <div className='hidden lg:block w-[30%]'>
			                <h1 className='text-[12px] md:text-[0.85rem] 2xl:text-base whitespace-normal text-[#929292] font-normal'>
			                  {item?.description}
			                </h1>
			              </div>
			              <div className='w-[25%] lg:w-[15%] text-center lm:text-left'>
			                <h1 className='ml-[4px] md:ml-[0px] text-[14px] md:text-[0.85rem]'>{item?.emissions}</h1>
			              </div>
			              <div className='w-[25%] lg:w-[15%]'>
			                <h1 className='text-[14px] md:text-[0.85rem]'>
			                	{item?.fees}<span className="text-[8px]">&nbsp;&nbsp;AIUS</span>
			                </h1>
			              </div>
			              <div className='w-[25%] lg:w-[20%]'>
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