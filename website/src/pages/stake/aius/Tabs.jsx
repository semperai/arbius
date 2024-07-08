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
                <div className="hidden lg:flex justify-start ">
                    <div className="all-stake flex stake-items font-[600] justify-between w-[50%]">
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

                
                {selectedtab === "Dashboard" ? (<DashBoard/>): (<Gauge/>)}
            
                {/* {selectedtab === "Stake" && (<Stake />)}
                {selectedtab === "Stats" && (
                    <Stats />
                )}
                {selectedtab === "Activity" && (
                    <div className="w-mobile-section-width lg:w-[90%] m-[auto]">
                        <ActivityTable />
                    </div>
                )} */}
            </div>

        </>
    )
}

export default Tabs