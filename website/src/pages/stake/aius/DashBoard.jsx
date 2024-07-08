import React from 'react'
import Slider from './Slider'

function DashBoard() {
    return (
        <div className='lg:w-section-width w-mobile-section-width mx-auto max-w-center-width py-24'>
            <h1 className='text-[#4A28FF] text-[50px]'>veAIUS Dashboard</h1>

            <div className='grid grid-cols-3 gap-10 my-10'>
                <div className="col-span-1 h-auto">

                    <div className='rounded-2xl p-8 bg-white stake-box-shadow h-full'>

                        <h1 className='text-[#4A28FF] text-[20px]'>Wallet</h1>
                        <div className='flex justify-start gap-12 mt-6 mb-10'>

                            <div className='flex flex-col gap-6 justify-center items-center'>
                                <div>
                                    <h2 className="text-[14px] opacity-60">Balance</h2>
                                    <h2 className='text-[16px]'>641.12451 AIUS</h2>

                                </div>
                                <div>
                                    <h2 className="text-[14px] opacity-60">Balance</h2>
                                    <h2 className='text-[16px]'>641.12451 AIUS</h2>

                                </div>

                            </div>
                            <div className='flex flex-col gap-6 justify-center items-center'>
                                <div>
                                    <h2 className="text-[14px] opacity-60">Balance</h2>
                                    <h2 className='text-[16px]'>641.12451 AIUS</h2>

                                </div>
                                <div>
                                    <h2 className="text-[14px] opacity-60">Balance</h2>
                                    <h2 className='text-[16px]'>641.12451 AIUS</h2>

                                </div>

                            </div>

                        </div>


                    </div>




                </div>
                <div className='col-span-2'>

                    <div className='rounded-2xl px-8 py-3 w-full bg-white'>
                        <h1 className='text-[#4A28FF] text-[20px]'>My Stakes</h1>
                    </div>

                    <div>

                        <Slider/>

                    </div>

                </div>

            </div>
            <div className='grid grid-cols-3 gap-10 my-10'>
                <div className="col-span-1 block">

                    <div className='rounded-2xl p-8 bg-white stake-box-shadow'>

                        <h1 className='text-[#4A28FF] text-[20px]'>Protocol Info</h1>
                        <div className='flex justify-start gap-12 mt-6 mb-10'>

                            <div className='flex flex-col gap-6 justify-center items-center'>
                                <div>
                                    <h2>Balance</h2>
                                    <h2>641.12451 AIUS</h2>

                                </div>
                                <div>
                                    <h2>Balance</h2>
                                    <h2>641.12451 AIUS</h2>

                                </div>

                            </div>
                            <div className='flex flex-col gap-6 justify-center items-center'>
                                <div>
                                    <h2>Balance</h2>
                                    <h2>641.12451 AIUS</h2>

                                </div>
                                <div>
                                    <h2>Balance</h2>
                                    <h2>641.12451 AIUS</h2>

                                </div>

                            </div>

                        </div>


                    </div>
                </div>
                <div className='col-span-2 pl-6'>

                    <div className='rounded-2xl p-8 bg-white stake-box-shadow'>
                        <h1 className='text-[#4A28FF] text-[20px]'>Staking</h1>
                        <div className='flex justify-between items-center mt-6 mb-10'>
                            <div>
                                <h2 className="text-[14px] opacity-60">Balance</h2>
                                <h2 className='text-[16px]'>641.12451 AIUS</h2>

                            </div>
                            <div>
                                <h2 className="text-[14px] opacity-60">Balance</h2>
                                <h2 className='text-[16px]'>641.12451 AIUS</h2>

                            </div>
                            <div>
                                <h2 className="text-[14px] opacity-60">Balance</h2>
                                <h2 className='text-[16px]'>641.12451 AIUS</h2>

                            </div>


                        </div>
                    </div>



                </div>

            </div>

        </div>
    )
}

export default DashBoard