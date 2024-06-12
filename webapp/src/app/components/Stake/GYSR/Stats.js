import React from 'react'

function Stats() {
    return (
        <>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-mobile-section-width lg:w-[90%] m-[auto]">

                <div className="rounded-2xl p-6 lg:p-10 h-[auto]  lg:h-[auto]  bg-white-background stake-card">
                    <div>
                        <h1 className="text-[15px] lg:text-[20px] font-medium">Overview</h1>

                    </div>

                    <div className="mt-6">
                        <div className="flex justify-start items-baseline">
                            <h1 className="text-[25px] xl:text-[30px] font-medium">672.4</h1>
                            <p className="text-para ">Uni-V2</p>
                        </div>
                        <h1 className="text-[8px] xl:text-[13px] font-medium">Currently Staked</h1>




                    </div>

                    <hr className="opacity-10 mt-6" />

                    <div className="flex justify-start gap-[40px] mt-4">
                        <div >

                            <h1 className="text-[16px]">$2.6M</h1>
                            <h2 className="text-[15px] font-medium">Currently Stacked</h2>

                        </div>
                        <div >

                            <h1 className="text-[16px]">$976.9</h1>
                            <h2 className="text-[15px] font-medium">24Hr Volumes</h2>

                        </div>

                    </div>

                </div>

                <div className="rounded-2xl p-6 lg:p-10 h-[auto] lg:h-[auto] bg-white-background stake-card">
                    <div>
                        <h1 className="text-[15px] lg:text-[20px] font-medium">Rewards</h1>

                    </div>

                    <div className="mt-6">
                        <div className="flex justify-start items-baseline">
                            <h1 className="text-[25px] lg:text-[30px] font-medium">218.94%</h1>

                        </div>
                        <h1 className="text-[8px] lg:text-[13px] font-medium">Currently Staked</h1>




                    </div>

                    <hr className="opacity-10 mt-6" />

                    <div className="bg-[#F9F6FF] rounded-[25px] p-6 mt-6">



                        <div className="">
                            <div className="flex justify-start items-baseline">
                                <h1 className="text-[15px] lg:text-[20px] font-medium">18.0k</h1>
                                <p className="text-[12px] ">AIUS</p>
                            </div>
                            <h1 className="text-[8px] lg:text-[13px] font-medium">Currently Staked</h1>




                        </div>



                        <div className="flex justify-start gap-[40px] mt-6 pb-8">
                            <div >

                                <h1 className="text-[16px]">$2.6M</h1>
                                <h2 className="text-[15px] font-medium">Currently Stacked</h2>

                            </div>
                            <div >

                                <h1 className="text-[16px]">$976.9</h1>
                                <h2 className="text-[15px] font-medium">24Hr Volumes</h2>

                            </div>

                        </div>


                    </div>

                </div>

                <div className="rounded-2xl p-6 lg:p-10 h-[auto] lg:h-[auto] bg-white-background stake-card">
                    <div>
                        <h1 className="text-[15px] lg:text-[20px] font-medium">Schedule</h1>

                    </div>

                    <div className="mt-6">
                        <div className="flex justify-start items-baseline">
                            <h1 className="text-[25px] lg:text-[30px] font-medium">271</h1>
                            <p className="text-para ">Days</p>

                        </div>
                        <h1 className="text-[8px] lg:text-[13px] font-medium">Remaining Duration</h1>




                    </div>

                    <hr className="opacity-10 mt-6" />

                    <div className="bg-[#F9F6FF] rounded-[25px] p-6 mt-6 flex justify-center h-[200px] overflow-y-scroll">

                        <div>

                            <div className="grid grid-cols-2 relative">

                                <div></div>
                                <div className="border-l-[1px] border-purple-text pl-6 relative pb-6">
                                    <div className="w-[8px] h-[8px] bg-purple-background rounded-full translate-x-[-28px]"></div>
                                    <div className="text-[8px] translate-y-[-18px]">
                                        <h1>20/07/2024</h1>
                                        <h1>Pool Created</h1>

                                    </div>



                                </div>

                            </div>

                            <div className="grid grid-cols-2 relative">

                                <div></div>
                                <div className="border-l-[1px] border-purple-text pl-6 relative pb-6">
                                    <div className="w-[8px] h-[8px] bg-purple-background rounded-full translate-x-[-28px]"></div>
                                    <div className="text-[8px] translate-y-[-18px] translate-x-[-90px]">
                                        <h1>20/07/2024</h1>
                                        <h1>Pool Created</h1>

                                    </div>



                                </div>

                            </div>
                            <div className="grid grid-cols-2 relative">

                                <div></div>
                                <div className="border-l-[1px] border-purple-text pl-6 relative pb-6">
                                    <div className="w-[8px] h-[8px] bg-purple-background rounded-full translate-x-[-28px]"></div>
                                    <div className="text-[8px] translate-y-[-18px]">
                                        <h1>20/07/2024</h1>
                                        <h1>Pool Created</h1>

                                    </div>



                                </div>

                            </div>
                            <div className="grid grid-cols-2 relative">

                                <div></div>
                                <div className="border-l-[1px] border-purple-text pl-6 relative pb-6">
                                    <div className="w-[8px] h-[8px] bg-purple-background rounded-full translate-x-[-28px]"></div>
                                    <div className="text-[8px] translate-y-[-18px] translate-x-[-90px]">
                                        <h1>20/07/2024</h1>
                                        <h1>Pool Created</h1>

                                    </div>



                                </div>

                            </div>
                        </div>







                    </div>

                </div>







            </div>
        </>
    )
}

export default Stats