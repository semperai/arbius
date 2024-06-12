import React from "react"
export default function Steps(){
    return (
           <div className="bg-white-background lg:h-[270px] h-auto stake-box-shadow rounded-2xl p-8 box-border">
                <div className="mt-2 flex r gap-4">
                     <div className="flex flex-col items-center">
                        <div className="w-[25px] h-[25px] bg-black flex items-center justify-center rounded-full"><p className="text-original-white">1</p></div>
                        <div className="w-[2px] h-[25px] bg-black"></div>
                        <div className="w-[25px] h-[25px] bg-black flex items-center justify-center rounded-full"><p className="text-original-white">2</p></div>
                        <div  className="w-[2px] h-[32px] bg-black"></div>
                        <div className="w-[25px] h-[25px] bg-black flex items-center justify-center rounded-full"><p className="text-original-white">3</p></div>
                        <div  className="w-[2px] h-[25px] bg-black"></div>
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
                  </div>
            </div>
    )
}