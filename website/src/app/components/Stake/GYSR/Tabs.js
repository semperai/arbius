"use client"

import React, { useState ,useEffect} from 'react'
import ActivityTable from "@/app/components/Stake/GYSR/ActivityTable";
import Stake from "@/app/components/Stake/GYSR/Stake";
import Stats from "@/app/components/Stake/GYSR/Stats";
const tabs = [
    "Stake", "Stats", "Activity"
]
const mobiletabs = [
    "Stats", "Activity"
]
function Tabs({data}) {
    const [selectedTab, setSelectedTab] = useState("Stake");
    const [mobileSelectedTab, setMobileSelectedTab] = useState("Stats");

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handleResize = () => {
                const isMobile = window.innerWidth <= 768;
                console.log(window.innerWidth)
                if (isMobile) {
                    setSelectedTab("Stats");
                    // alert('hi');
                } else {
                    
                    // alert('hiijijiji');
                }
            };
    
            // Run the handler on mount
            handleResize();
    
            // Add resize event listener
            window.addEventListener('resize', handleResize);
    
            // Cleanup on unmount
            return () => {
                window.removeEventListener('resize', handleResize);
            };
        }
    }, []);
    
    
    return (
        <>
            <div className="w-mobile-section-width lg:w-section-width m-[auto]  max-w-center-width ">
                <div className="hidden lg:flex justify-start ">
                    <div className="all-stake flex stake-items w-full justify-between w-[50%]">
                        {tabs.map(function (item, index) {
                            return (
                                <div
                                    className={`
                        ${selectedTab === item ? "selected" : "non-selected"} hover:text-purple-text`
                                    }
                                    onClick={() => {
                                        setSelectedTab(item)
                                    }}
                                    key={index}
                                >
                                    {item}
                                </div>
                            );
                        })}

                    </div>
                </div>


            </div>

            <div className="pt-8 pb-24 lg:py-24 max-w-center-width bg-aius-stake min-w-full">

                <div className="w-mobile-section-width lg:w-[90%] m-[auto] lg:hidden">
                    <div className="flex lg:hidden justify-center rounded-full bg-white-background w-[100%] mb-6 ">
                        {mobiletabs.map(function (item, index) {

                            return (
                                <div className="w-[50%]" key={index}>
                                    <button type="button" className={`${mobileSelectedTab === item ? "bg-buy-hover text-original-white" : "text-subtext-three"} rounded-full  flex items-center w-[100%] justify-center py-4 `} onClick={() => {
                                        setMobileSelectedTab(item)
                                        setSelectedTab(item)
                                    }}>
                                        <p className="relative z-10   mb-1 ">{item}</p>
                                    </button>
                                </div>
                            )
                        })}
                    </div>

                </div>

                {selectedTab === "Stake" && (<Stake />)}
                {selectedTab === "Stats" && (
                    <Stats data={data} />
                )}
                {selectedTab === "Activity" && (
                    <div className="w-mobile-section-width lg:w-section-width m-[auto] pt-8 pb-16 max-w-center-width ">
                        <ActivityTable />
                    </div>
                )}
            </div>

        </>
    )
}

export default Tabs