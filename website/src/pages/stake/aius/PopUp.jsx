import React from 'react'
import Image from "next/image"
import cross_icon from "../../../app/assets/images/cross_icon.png"
import arbius_logo_without_name from '@/app/assets/images/arbius_logo_without_name.png'
function PopUp({ icon, modelName, emissions, prompts, description, governance, setShowPopUp }) {
    return (
        <div className='absolute inset-0 flex justify-center  items-center backdrop-blur-lg z-20 h-screen' onClick={() => setShowPopUp(false)}>
            <div className='rounded-xl pt-3 pb-6 px-6  bg-white w-[500px] stake-box-shadow' onClick={(e) => {
                e.stopPropagation()
            }}>

                <div className='flex justify-between items-center my-2'>
                    <div className='flex justify-start items-center gap-3'>
                        <div className='bg-[#4A28FF] p-3  rounded-full '>
                            <Image src={icon} className='w-[14px] h-[14px]' />

                        </div>
                        <h1>{modelName}</h1>
                    </div>
                    <div className='cursor-pointer' onClick={() => setShowPopUp(false)}>
                        <Image src={cross_icon} className='w-[10px] h-[10px]' />
                    </div>

                </div>

                <p className='text-xs opacity-60 mb-6'>{description}</p>

                <div className='flex justify-start items-center gap-10 my-2'>
                    <div>
                        <h3 className='opacity-50 text-xs'>Emissions</h3>
                        <h1 className='mt-1'>{emissions}</h1>
                    </div>
                    <div>
                        <h3 className='opacity-50 text-xs'>Alloted Governance Power</h3>
                        <h1 className='mt-1'>{governance}</h1>
                    </div>

                </div>
                <div className='flex justify-start items-center gap-10 my-4'>
                    <div>
                        <h3 className='opacity-50 text-xs'>Total Prompts Requested</h3>
                        <h1 className='mt-1'>{prompts}</h1>
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
                            <input className="w-[100%] border-0 outline-none rounded-r-3xl p-1 px-2 lato-bold text-[15px]" type="number" placeholder="0.0" />
                        </div>
                    </div>
                </div>

                <div className='flex justify-end'>
                    <button
                        type="button"
                        className="relative group bg-black-background py-1 px-3 lg:px-5 rounded-full flex items-center gap-3 "
                    >
                        <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-5 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="lato-bold  relative z-10 text-original-white lg:text-[100%]">
                            Vote
                        </div>

                    </button>

                </div>

            </div>

        </div>
    )
}

export default PopUp