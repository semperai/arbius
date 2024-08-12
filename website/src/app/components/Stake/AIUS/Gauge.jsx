import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import polygon from "../../../assets/images/polygon.png"
import info_icon from "../../../assets/images/info_icon.png"
import mistral_icon from "../../../assets/images/mistral_icon.png"
import nemotron_icon from "../../../assets/images/nemotron_icon.png"
import deepseek_icon from "../../../assets/images/deepseek_icon.png"
import llama_icon from "../../../assets/images/llama.png"
import search_icon from "../../../assets/images/search_icon.png"
import PopUp from './PopUp'
import cross_icon from "../../../assets/images/cross_icon.png"
import arbius_logo_without_name from '@/app/assets/images/arbius_logo_without_name.png'
import clock_icon from "../../../assets/images/clock_icon.png"
import skeleton from "../../../assets/images/skeleton.png"
import prompts from "../../../assets/images/prompts.png"
import thunder from "../../../assets/images/thunder.png"
import governance from "../../../assets/images/governance.png"
import info_red from "../../../assets/images/info_red.png"

const getVoteStartDate = () => {
    return new Date("08/23/2024")
}
function Gauge() {
    const data = [
        {
            model_name: "Mistral-large-2407",
            model_id: "Mistral-large-2407",
            description: "Text Generator",
            emissions: "21.1244%",
            prompts: "121,412",
            icon: mistral_icon,


        },
        {
            model_name: "Nemotron-4-340b",
            model_id: "Nemotron-4-340b",
            description: "Text Generator",
            emissions: "21.1244%",
            prompts: "121,412",
            icon: nemotron_icon,

        },
        {
            model_name: "Llama-3.1-405b",
            model_id: "Llama-3.1-405b",
            description: "Text Generator",
            emissions: "21.1244%",
            prompts: "121,412",
            icon: llama_icon,
        },
        {
            model_name: "Deepseek-coder-v2",
            model_id: "Deepseek-coder-v2",
            description: "Code Generator",
            emissions: "21.1244%",
            prompts: "121,412",
            icon: deepseek_icon,
        }
    ]

    const [selectedModel, setSelectedModel] = useState(null)
    const [showPopUp, setShowPopUp] = useState(false)
    const [filteredData, setFilteredData] = useState(data)
    const [searchText, setSearchText] = useState("")
    console.log("filteredData", filteredData)
    const handleSearch = (e) => {
        console.log(e.target.value)
        setSearchText(e.target.value)
        // debounce the function call   
        let time = setTimeout(() => {

            setFilteredData(data.filter(item => item.model_name.toLowerCase().includes(e.target.value.toLowerCase())))
            clearTimeout(time)
        }, 300)


    }



    const [timeRemaining, setTimeRemaining] = useState({});
    useEffect(() => {
        updateTimeRemaining(getVoteStartDate());

        const intervalId = setInterval(() => {
            updateTimeRemaining(getVoteStartDate());
            console.log("updateTimeRemaining");
        }, 60000); // Update every minute

        return () => clearInterval(intervalId);
    }, []);

    const updateTimeRemaining = (targetDate) => {
        const now = new Date();
        const target = new Date(targetDate);
        const difference = target - now;
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining({ days, hours, minutes });
    };


    return (
        <div className='lg:w-section-width w-mobile-section-width mx-auto max-w-center-width py-10 lg:py-16 text-black-text '>

            {
                showPopUp && selectedModel !== null && (
                    <PopUp setShowPopUp={setShowPopUp}>
                        <>
                            <div className='flex justify-between items-center my-2'>
                                <div className='flex justify-start items-center gap-3'>
                                    <div className='bg-[#4A28FF] p-3  rounded-full '>
                                        <Image src={selectedModel?.icon} className='w-[14px] h-[14px]' />

                                    </div>
                                    <h1>{selectedModel?.model_name}</h1>
                                </div>
                                <div className='cursor-pointer' onClick={() => setShowPopUp(false)}>
                                    <Image src={cross_icon} className='w-[10px] h-[10px]' />
                                </div>
                            </div>

                            <p className='text-xs opacity-60 mb-6'>{selectedModel?.description}</p>

                            <div className='flex justify-start items-center gap-10 my-2'>
                                <div>
                                    <div className='flex justify-start gap-1 items-center'><Image src={thunder} className='w-[20px] h-[20px]' /><h3 className='opacity-50 text-xs'>Emissions</h3></div>
                                    {/* <h1 className='mt-1'>{selectedModel?.emissions}</h1> */}
                                    <Image src={skeleton} className='w-[100%] h-[20px] rounded-lg mt-1' />
                                </div>
                                <div>
                                    <div className='flex justify-start gap-1 items-center'><Image src={governance} className='w-[16px] h-[16px]' /><h3 className='opacity-50 text-xs'>Alloted Governance Power</h3></div>
                                    {/* <h1 className='mt-1'>{0}</h1> */}
                                    <Image src={skeleton} className='w-[100%] h-[20px] rounded-lg mt-1' />
                                </div>

                            </div>
                            <div className='flex justify-start items-center gap-10 my-4'>
                                <div>
                                    <div className='flex justify-start gap-1 items-center'><Image src={prompts} className='w-[20px] h-[20px]' /><h3 className='opacity-50 text-xs'>Total Prompts Requested</h3></div>
                                    {/* <h1 className='mt-1'>{selectedModel?.prompts}</h1> */}
                                    <Image src={skeleton} className='w-[100%] h-[20px] rounded-lg mt-1' />
                                </div>


                            </div>

                            <div className='flex justify-between items-center my-1 mt-6'>

                                <h1>Add veAIUS</h1>
                                <p className='text-xs'>Available Governance Power 0</p>

                            </div>

                            <div className='my-4'>
                                <div className="border border-[#2F2F2F] rounded-3xl flex items-center">
                                    <div className="bg-stake-input flex items-center gap-2 justify-center rounded-l-3xl  p-1 px-2 box-border">
                                        <div className="bg-white-background w-[30px] h-[30px] rounded-[50%] flex items-center justify-center ">
                                            <Image src={arbius_logo_without_name} width={15} alt="arbius" />
                                        </div>
                                        <p className="pr- text-aius lato-bold text-[12px]">veAIUS</p>
                                    </div>
                                    <div className="w-[94%]">
                                        <input className="w-[100%] border-0 outline-none rounded-r-3xl p-1 px-2 lato-bold text-[15px] focus:ring-0" type="number" placeholder="0.0" />
                                    </div>
                                </div>
                            </div>
                            <div className='flex justify-center'>

                                <div className='p-3 rounded-[10px] border-[1.6px] border-[#DB000033] border-opacity-20 bg-[#FF555508] bg-opacity-5 w-full'>
                                    <div className='flex justify-between items-center gap-2'>
                                        <Image src={info_red} className='w-[16px] h-[16px]' />
                                        <h1 className='text-center text-[#DB0000] text-[16px]'>Voting is currently closed!</h1>
                                        <div>

                                        </div>
                                    </div>
                                </div>

                            </div>
                            {/* <div className='flex justify-end'>
                                <button
                                    type="button"
                                    className="relative group bg-black-background py-[6px] px-8 lg:px-8 rounded-full flex items-center gap-3 "
                                >
                                    <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-5 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div className="lato-bold  relative z-10 text-original-white mb-[3.3px] lg:mb-0 text-sm lg:text-[90%]">
                                        Vote
                                    </div>

                                </button>

                            </div> */}
                        </>
                    </PopUp>
                )
            }

            <div className='hidden lg:flex justify-between items-center w-full '>
                <div className='flex justify-start items-center gap-4 w-full h-auto'>
                    <h1 className='text-[40px] text-[#4A28FF] mb-2 lato-bold'>Gauge</h1>
                    <div className='rounded-md bg-white-background flex  items-center px-2 pr-3 justify-between h-auto w-[70%] stake-box-shadow'>
                        <input placeholder='Search Model name or ID' className='bg-transparent px-3 p-2 py-3 h-full w-full border-0 focus:outline-none ' value={searchText} onChange={(e) => {
                            handleSearch(e)
                        }} />
                        <Image src={search_icon} className='h-4 w-4' />
                    </div>
                </div>

                <div className='text-[#4A28FF] text-[14px] w-[30%] gap-2 text-end font-semibold flex justify-end items-center'>
                    <Image src={clock_icon} className='h-4 w-4' /> 
                    {/* <h1 className='xl:text-[12px] 2xl:text-[16px]'>Voting starts in {timeRemaining.days} D : {timeRemaining.hours} Hr : {timeRemaining.minutes} Min</h1> */}

                    <div className='flex justify-start items-center gap-2'>
                        <h1 className='xl:text-[12px] 2xl:text-[16px]'>Voting starts in</h1>
                        <Image src={skeleton} className=' h-[20px] w-[100px] md:w-[80px] xl:w-[140px] rounded-lg  contrast-[90%] opacity-70' />

                    </div>
                </div>

            </div>
            <div className='flex flex-col items-start mb-2 um:mb-0 um:flex-row lg:hidden justify-between um:items-center font-semibold'>
                <h1 className='text-[40px] text-[#4A28FF] mb-2  lato-bold'>Gauge</h1>
                <div className='text-[#4A28FF] text-[.85rem]  text-end flex gap-2 justify-end items-center'>
                  <Image src={clock_icon} className='h-4 w-4' />
                    {/* <h1>Voting starts in   02 D : 13 Hr : 16 Min</h1> */}
                    <div className='flex justify-start items-center gap-2'>
                        <h1 className=''>Voting starts in</h1>
                        <Image src={skeleton} className='h-[20px] w-[100px] md:w-[80px] xl:w-[140px] rounded-lg contrast-[90%] opacity-70' />
                    </div>
                </div>

            </div>
            <div className='flex lg:hidden rounded-md items-center px-2 pr-3  bg-white-background  justify-between h-auto stake-box-shadow'>
                <input placeholder='Search Model name or ID' className='bg-transparent px-3 p-2 py-3 h-full w-full border-0 focus:outline-none placeholder:lato-regular' value={searchText} onChange={(e) => {
                    handleSearch(e)
                }} />
                <Image src={search_icon} className='h-4 w-4' />
            </div>
            <div className='w-full overflow-x-auto xl:overflow-x-visible'>
                <div className='gauge-table-headings rounded-lg pt-2 pb-2 px-5 lg:pt-6 lg:pb-6 lg:px-10 flex justify-between gap-8 items-center bg-white-background mt-2 mb-4 min-w-[1000px] font-semibold'>
                    <div className='w-[25%]'>
                        <h1>Model Name</h1>
                    </div>
                    <div className='w-[20%]'>
                        <h1>Description</h1>
                    </div>
                    <div className='w-[20%]'>
                        <h1>Emissions</h1>
                    </div>
                    <div className='w-[20%]'>
                        <h1>Total Prompts Requested</h1>
                    </div>
                    <div className='w-[15%]'>

                    </div>

                </div>

                {filteredData?.map((item, key) => {
                    return (

                        <div className='gauge-table-item rounded-lg px-5 pt-4 pb-4 lg:px-10 flex justify-between gap-8 items-center bg-white-background my-3 relative min-w-[1000px] font-semibold ' key={key}>
                            <div className='flex hidden justify-start items-center absolute left-[-125px]  top-[10%] z-20 ' id={key}>
                                <div className='bg-white-background w-auto p-3 rounded-xl w-[108px]'>
                                    <h1 className='text-[.6rem] mb-1 text-[#8D8D8D]'>Model ID</h1>
                                    <p className='text-[.6rem]'>{item?.model_id}</p>
                                </div>
                                <Image src={polygon} className='-ml-2' />

                            </div>
                            <div className='w-[25%] flex justify-start gap-2 items-center'>
                                <div className="flex items-center justify-center w-[28px] h-[28px] rounded-full bg-[#4A28FF]">
                                    <div className="relative w-[16px] h-[16px] flex items-center justify-center">
                                        <Image src={item?.icon}  fill className='w-full h-full object-contain' />
                                    </div>
                                </div>
                                <h1 className='text-[0.85rem]  2xl:text-base'>{item?.model_name}</h1>
                                <div className=' cursor-pointer grayscale-[1] opacity-30 hover:grayscale-0 hover:opacity-100 mt-[1px]' onMouseOver={() => {
                                    document.getElementById(key).style.display = "flex"
                                }}
                                    // onMouseLeave={() => {
                                    //     document.getElementById(key).style.display = "none"
                                    // }}
                                >
                                    <Image src={info_icon} height={12} width={12} />
                                </div>
                            </div>
                            <div className='w-[20%]'>
                                <h1 className='text-[0.85rem]  2xl:text-base'>{item?.description}</h1>
                            </div>
                            <div className='w-[20%]'>
                                <Image src={skeleton} className='w-[100%] h-[24px] rounded-lg ' />
                                {/* <h1>{item?.emissions}</h1> */}
                            </div>
                            <div className='w-[20%]'>
                                <Image src={skeleton} className='w-[100%] h-[24px] rounded-lg ' />
                                {/* <h1>{item?.prompts}</h1> */}
                            </div>
                            <div className='w-[15%] flex justify-end'>

                                {/* <button className='rounded-full bg-[#F1F0F3] text-[#AFAFB0] p-1 text-sm px-6' onClick={() => {
                                    setSelectedModel(item)
                                    setShowPopUp(true);


                                }}>Vote</button> */}
                                <button className='relative group bg-black-background py-[6px] px-8 lg:px-8 rounded-full flex items-center gap-3' onClick={() => {
                                    setSelectedModel(item)
                                    setShowPopUp(true);


                                }}>
                                    <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-5 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div className="lato-bold  relative z-10 text-original-white mb-[3.5px] lg:mb-0 text-sm lg:text-[90%]">
                                        Vote
                                    </div>
                                </button>



                            </div>

                        </div>
                    )
                })}

            </div>


        </div>
    )
}

export default Gauge