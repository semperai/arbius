"use client"

import React, { useState } from 'react'
import ActivityTable from "@/app/components/Stake/GYSR/ActivityTable";
import Stake from "@/app/components/Stake/GYSR/Stake";
import Stats from "@/app/components/Stake/GYSR/Stats";
const tabs = [
    "Stake", "Stats", "Activity"
]
const mobiletabs = [
    "Stats", "Activity"
]
function Tabs() {
    const [selectedtab, setSelectedTab] = useState("Stake")
    const [mobileSelectedtab, setMobileSelectedTab] = useState("Stats")
    return (
        <>
            <div className="w-mobile-section-width lg:w-section-width m-[auto]  max-w-center-width ">
                <div className="hidden lg:flex justify-start ">
                    <div className="all-stake flex stake-items w-full justify-between w-[50%]">
                        {tabs.map(function (item, index) {
                            return (
                                <div
                                    className={`
                        ${selectedtab === item ? "selected" : "non-selected"} hover:text-purple-text`
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
                                <div className="w-[50%]">
                                    <button type="button" className={`${mobileSelectedtab === item ? "bg-buy-hover text-original-white" : "text-subtext-three"} rounded-full  flex items-center w-[100%] justify-center py-4 `} onClick={() => {
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

                {selectedtab === "Stake" && (<Stake />)}
                {selectedtab === "Stats" && (
                    <Stats />
                )}
                {selectedtab === "Activity" && (
                    <div className="w-mobile-section-width lg:w-[90%] m-[auto]">
                        <ActivityTable />
                    </div>
                )}
            </div>

        </>
    )
}

export default Tabs