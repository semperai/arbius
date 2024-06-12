'use client'
import Image from "next/image"
import React, { useState } from "react"
import gysr from "../../assets/images/gysr_logo_without_name.png";
import unilogo from "../../assets/images/unilogo.png"
import arbiuslogorounded from "../../assets/images/arbiuslogo_rounded.png"
import gysrlogorounded from "../../assets/images/gysrlogo_rounded.png"
import GradientCrad from "@/app/components/Stake/GYSR/GradientCrad";

import ActivityTable from "@/app/components/Stake/GYSR/ActivityTable";
import Stake from "@/app/components/Stake/GYSR/Stake";
import Stats from "@/app/components/Stake/GYSR/Stats";

export default function GYSR() {

    const headerCardData = [

        {
            heading: 673,
            subheading: "UNI-V2",
            para: "Stacked",
            logo: unilogo
        },
        {
            heading: "13.5K",
            subheading: "AIUS",
            para: "Remaining",
            logo: arbiuslogorounded
        },
        {
            heading: "204.29%",
            subheading: "",
            para: "APR",
            logo: gysrlogorounded,
        }

    ]

    const tabs = [
        "Stake", "Stats", "Activity"
    ]
    const mobiletabs = [
        "Stats", "Activity"
    ]


    const [selectedtab, setSelectedTab] = useState("Stake")
    const [mobileSelectedtab, setMobileSelectedTab] = useState("Stats")

    console.log(selectedtab);

    return (
        <div className="">
            <div className="w-mobile-section-width lg:w-section-width m-[auto] py-24 max-w-center-width">
                <div>
                    <div className="flex justify-start items-center">

                        <div className="relative w-[30px] lg:w-[40px] h-[auto]">
                            <Image src={gysr} />
                        </div>

                        <div className="flex justify-start items-baseline pl-2">
                            <h1 className="lg:text-header 2xl:text-header-2xl text-mobile-header font-medium text-black-text">
                                GYSR
                            </h1>
                            <h2 className="lg:text-[25px] 2xl:text-[45px] text-[20px] font-medium text-black-text pl-1">
                                Stake
                            </h2>

                        </div>

                    </div>
                    <p className="text-para text-subtext-three font-Sequel-Sans-Light-Body text-subtext-two mt-6">
                        Stake AIUS and ETH, earn AIUS rewards.
                    </p>


                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                        {headerCardData.map((item, key) => {
                            return (
                                <GradientCrad key={key} heading={item?.heading} subheading={item?.subheading} para={item?.para} logo={item?.logo} />
                            )
                        })}

                    </div>

                    <p className="text-para text-subtext-three font-medium  text-subtext-two mt-6">
                        Get UNI-V2 by providing liquidity on Uniswap ➚
                    </p>

                </div>

            </div>


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

                                        <p className="relative z-10  font-Sequel-Sans-Medium-Head mb-1 ">{item}</p>

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


        </div>
    )
}