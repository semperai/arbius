import React from 'react'

import Image from 'next/image'
import polygon from "../../../app/assets/images/polygon.png"
import info_icon from "../../../app/assets/images/info_icon.png"
function Gauge() {
    const data = [
        {
            model_name: "kandinsky 2",
            model_id: "arbiusllama3-400b-0703",
            description: "Image Generator",
            emissions: "21.1244%",
            prompts: "121,412",

        },
        {
            model_name: "kandinsky 2",
            model_id: "arbiusllama3-400b-0703",
            description: "Image Generator",
            emissions: "21.1244%",
            prompts: "121,412",

        },
        {
            model_name: "kandinsky 2",
            model_id: "arbiusllama3-400b-0703",
            description: "Image Generator",
            emissions: "21.1244%",
            prompts: "121,412",

        }
    ]

    return (
        <div className='lg:w-section-width w-mobile-section-width mx-auto max-w-center-width py-24'>
            <div className='flex justify-between items-center w-full'>
                <div className='flex justify-start items-center gap-4 w-full h-auto'>
                    <h1 className='text-[40px] text-[#4A28FF] mb-2'>Gauge</h1>
                    <div className='rounded-md bg-white flex justify-between h-auto w-[70%] stake-box-shadow'>
                        <input className='bg-transparent p-2 py-3 h-full w-full border-0 focus:outline-none ' />

                    </div>
                </div>

                <div className='text-[#4A28FF] text-sm w-[30%] text-end'>
                    <h1>Voting starts in   02 D : 13 Hr : 16 Min</h1>
                </div>

            </div>
            <div className='w-full overflow-x-auto'>
                <div className='rounded-lg  p-6 px-10 flex justify-between gap-8 items-center bg-white mt-2 mb-4 min-w-[1200px]'>
                    <div className='w-[20%]'>
                        <h1>Model Name</h1>
                    </div>
                    <div className='w-[20%]'>
                        <h1>Description</h1>
                    </div>
                    <div className='w-[20%]'>
                        <h1>Emission</h1>
                    </div>
                    <div className='w-[20%]'>
                        <h1>Total Prompts Requested</h1>
                    </div>
                    <div className='w-[20%]'>

                    </div>

                </div>

                {data?.map((item, key) => {
                    return (

                        <div className='rounded-lg  p-4 px-10 flex justify-between gap-8 items-center bg-white my-2 relative min-w-[1200px]' key={key}>
                            <div className='flex hidden justify-start items-center absolute left-[-110px]  top-[10%] z-20' id={key}>
                                <div className='bg-white w-auto p-3 rounded-xl'>
                                    <h1 className='text-[.6rem] mb-1 opacity-40'>Model ID</h1>
                                    <p className='text-[.4rem]'>{item?.model_id}</p>
                                </div>
                                <Image src={polygon} className='-ml-2' />

                            </div>
                            <div className='w-[20%] flex justify-start gap-2 items-center'>
                                <h1>{item?.model_name}</h1>
                                <div className=' cursor-pointer grayscale-[1] opacity-30 hover:grayscale-0 hover:opacity-100' onMouseOver={() => {
                                    document.getElementById(key).style.display = "flex"
                                }}
                                    onMouseLeave={() => {
                                        document.getElementById(key).style.display = "none"
                                    }}
                                >
                                    <Image src={info_icon} height={15} width={15} />
                                </div>
                            </div>
                            <div className='w-[20%]'>
                                <h1>{item?.description}</h1>
                            </div>
                            <div className='w-[20%]'>
                                <h1>{item?.emissions}</h1>
                            </div>
                            <div className='w-[20%]'>
                                <h1>{item?.prompts}</h1>
                            </div>
                            <div className='w-[20%] flex justify-end'>

                                <button className='rounded-full bg-[#F1F0F3] text-[#AFAFB0] p-1 text-sm px-6'>Vote</button>

                            </div>

                        </div>
                    )
                })}

            </div>


        </div>
    )
}

export default Gauge