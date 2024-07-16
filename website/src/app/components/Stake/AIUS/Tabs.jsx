"use client"

import React, { useState } from 'react'
import DashBoard from './DashBoard'
import Gauge from './Gauge'
// import ActivityTable from "@/app/components/Stake/GYSR/ActivityTable";
// import Stake from "@/app/components/Stake/GYSR/Stake";
// import Stats from "@/app/components/Stake/GYSR/Stats";
const tabs = [
    "Dashboard", "Gauge"
]

function Tabs() {
    const [selectedtab, setSelectedTab] = useState("Dashboard")

    return (
        <>
            <div className="w-mobile-section-width lg:w-section-width m-[auto]  max-w-center-width ">
                <div className="flex justify-start ">
                    <div className="all-stake flex stake-items font-[600] justify-between lg:w-[30%] w-full">
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

            <div className="pt-8 pb-24 lg:py-10 max-w-center-width bg-aius-stake min-w-full relative">

                
                {selectedtab === "Dashboard" ? (<DashBoard/>): (<Gauge/>)}
            
            </div>

        </>
    )
}

export default Tabs