import React from "react"
export default function Steps() {
    return (
        <div className="bg-white-background lg:h-[270px] h-auto stake-box-shadow rounded-2xl p-8 box-border flex justify-start items-start">
            {/* <div className="mt-2 flex r gap-4">
                <div className="flex flex-col items-center">
                    <div className="w-[25px] h-[25px] bg-black flex items-center justify-center rounded-full"><p className="text-original-white">1</p></div>
                    <div className="w-[2px] h-[25px] bg-black"></div>
                    <div className="w-[25px] h-[25px] bg-black flex items-center justify-center rounded-full"><p className="text-original-white">2</p></div>
                    <div className="w-[2px] h-[32px] bg-black"></div>
                    <div className="w-[25px] h-[25px] bg-black flex items-center justify-center rounded-full"><p className="text-original-white">3</p></div>
                    <div className="w-[2px] h-[25px] bg-black"></div>
                    <div className="w-[25px] h-[25px] bg-black flex items-center justify-center rounded-full"><p className="text-original-white">4</p></div>
                </div>
                <div>
                    <div>
                        <p className="text-original-black lato-regular">
                            Select the amount of AIUS you want to lock.
                        </p>
                    </div>
                    <div className="mt-[26px]">
                        <p className="text-original-black lato-regular">
                            Select the number of weeks, the minimum lock time is one week, and the maximum lock time is 4 years.
                        </p>
                    </div>
                    <div className="mt-[10px]">
                        <p className="text-original-black lato-regular">
                            Confirm the locking
                        </p>
                    </div>
                    <div className="mt-[22px]">
                        <p className="text-original-black lato-regular">
                            Your lock will be available in the dashboard.  Confirm the locking
                        </p>
                    </div>
                </div>
            </div> */}
          



            <div class="flex  items-start justify-start bg-white  ">
                <div class="space-y-6 border-l-2">
                    <div class="relative w-full">
                        <div className="absolute -top-0 z-10 ml-[-.73rem] p-2 w-[1.4rem] h-[1.4rem] flex justify-center items-center rounded-full text-blue-500 bg-black text-original-white">
                            <h1>1</h1>
                        </div>
                        <div class="ml-6 pb-2">
                            <h4 class="font-bold text-blue-500 text-original-black lato-regular text-[12px] lg:text-para">Select the amount of AIUS you want to lock.</h4>

                        </div>
                    </div>
                    <div class="relative w-full">
                        <div className="absolute -top-0 z-10 ml-[-.73rem] p-2 w-[1.4rem] h-[1.4rem] flex justify-center items-center rounded-full text-blue-500 bg-black text-original-white">
                            <h1>2</h1>
                        </div>
                        <div class="ml-6 pb-2">
                            <h4 class="font-bold text-blue-500 text-original-black lato-regular text-[12px] lg:text-para">Select the number of weeks, the minimum lock time is one week, and the maximum lock time is 4 years.</h4>

                        </div>
                    </div>
                    <div class="relative w-full">
                        <div className="absolute -top-0 z-10 ml-[-.73rem] p-2 w-[1.4rem] h-[1.4rem] flex justify-center items-center rounded-full text-blue-500 bg-black text-original-white">
                            <h1>3</h1>
                        </div>
                        <div class="ml-6 pb-2">
                            <h4 class="font-bold text-blue-500 text-original-black lato-regular text-[12px] lg:text-para">Confirm the locking</h4>

                        </div>
                    </div>
                    <div class="relative w-full">
                        <div className="absolute -top-0 z-10 ml-[-.73rem] p-2 w-[1.4rem] h-[1.4rem] flex justify-center items-center rounded-full text-blue-500 bg-black text-original-white">
                            <h1>4</h1>
                        </div>
                        <div class="ml-6 mb-[-1rem] ">
                            <h4 class="font-bold text-blue-500 text-original-black lato-regular text-[12px] lg:text-para">Your lock will be available in the dashboard.</h4>

                        </div>
                    </div>

                </div>
            </div>



        </div>
    )
}