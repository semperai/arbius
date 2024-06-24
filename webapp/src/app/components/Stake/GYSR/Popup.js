import React from 'react'
import crossIcon from "@/app/assets/images/cross.png"
import Image from 'next/image'
function Popup({isPopupOpen, setIsPopupOpen}) {
    return (
        <div className='fixed inset-0 flex justify-center items-center backdrop-blur-lg h-full overflow-y-hidden z-50'>

            <div className="bg-white-background p-8 rounded-[25px] w-[600px] shadow-md">

                <div className='flex justify-between items-center'>

                    <h1 className='text-[18px]'>Confirm</h1>

                    <Image src={crossIcon} width={12} className='cursor-pointer' onClick={()=> setIsPopupOpen(false)} />

                </div>

                <p className='text-[11px] my-6 font-thin'><span className='text-[14px] font-Geist-SemiBold'>NOTE : </span> Claiming rewards resets your GYSR multiplier and vesting period. You may optionally add GYSR to your new staked position.</p>

                <div className="">

                    <p className='text-[14px] my-6 text-grey-text font-Geist-Regular border-b-[1px] border-grey-text w-[max-content] pb-1'><span className='text-[16px] font-Geist-SemiBold text-opacity-100 text-black-text'>Claim :  </span>1.1244555525121245454 <span className='text-[16px] font-Geist-SemiBold text-opacity-100 text-black-text'>AIUS  </span></p>

                </div>


                <div className="flex justify-start items-baseline gap-4">
                    <div className="rounded-[25px]  flex justify-center w-[100%] mt-6">
                        <input className="p-2 lg:p-3 border-[1px] border-r-0 rounded-l-[25px] rounded-r-none w-[70%] focus:outline-none" placeholder="0" />
                        <div className="p-2 lg:p-3 w-[50%] rounded-r-[25px] rounded-l-none  border-[1px] border-l-0 bg-[#E6DFFF] flex justify-center gap-2 lg:gap-4 items-center">
                            <h className="text-[10px] lg:text-[15px] font-medium">GYSR</h>
                            <div className=" bg-[#5E40FD] rounded-full px-3 py-[1px] text-original-white flex items-center">
                                <p className="text-[6px] lg:text-[12px] pb-[2px]">max</p>
                            </div>
                        </div>


                    </div>
                    <div>
                        <h1 className="text-[30px] font-medium">1.00x</h1>
                    </div>
                </div>

                <div className='mt-8 w-full'>

                    <button type="button" className="relative group bg-black py-2  px-8 rounded-full flex items-center  gap-3 w-[100%] lg:w-[100%]" onClick={() => setIsStakeClicked(true)}>
                        <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-8 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <p className="relative z-10 text-original-white font-Sequel-Sans-Medium-Head mb-1 w-[100%] lg:w-[100%]">Claim</p>

                    </button>

                </div>
            </div>

        </div>
    )
}

export default Popup