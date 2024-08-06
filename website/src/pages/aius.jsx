"use client"
import React, { useState } from "react"
import Stake from "../app/components/Stake/AIUS/Stake"
import Steps from "../app/components/Stake/AIUS/Steps"
import Process from "../app/components/Stake/AIUS/Process"
import { Fade } from "react-awesome-reveal"
import RootLayout from "@/app/layout";
import Tabs from "../app/components/Stake/AIUS/Tabs"
import Notifications from "../app/components/Stake/AIUS/Notifications"
import { useAccount, useContractRead, useSwitchNetwork } from 'wagmi'
import config from "../sepolia_config.json"
const BASETOKEN_ADDRESS_V1 = config.v2_baseTokenAddress;
import baseTokenV1 from "../app/abis/baseTokenV1.json"
import { fetchArbiusData } from "../app/Utils/getArbiusData"
import { BigNumber } from 'ethers';

export default function AIUS({protocolData}) {
    const [selectedtab, setSelectedTab] = useState("Dashboard")
    const { address, isConnected } = useAccount();
    console.log({address});
    console.log({isConnected});
    const {
        data, isError, isLoading
    } = useContractRead({
        address: BASETOKEN_ADDRESS_V1,
        abi: baseTokenV1.abi,
        functionName: 'balanceOf',
        args: [
            address
        ],
        enabled: isConnected
    })

    return (
        <RootLayout>
            <div className="">
                <div className=" pt-24 xl:pb-24 pb-8">
                    <div className="lg:w-section-width w-mobile-section-width mx-auto max-w-center-width">
                        <div>
                            <div className="flex items-center gap-2">

                                <h2 className="lato-bold text-[8vw] lg:text-header 2xl:text-header-2xl  text-black-text mb-4">
                                    <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
                                        veAIUS Staking
                                    </Fade>
                                </h2>

                                <Fade direction="up" triggerOnce={true}>
                                    <div className="bg-[#ece9fe] inline-block py-2 px-3 rounded-2xl mb-4 lg:mb-0">
                                        <p className="text-[#4A28FF] bg-[#ece9fe] text-[8px]  lg:text-[14px] lato-regular">Coming Soon!</p>
                                    </div>

                                </Fade>

                            </div>
                            <div className="flex lg:flex-row flex-col lg:gap-0 gap-4 justify-between">
                                <div className="lg:w-[48%] w-[100%]">
                                    <Stake selectedtab={selectedtab} setSelectedTab={setSelectedTab} data={data} isLoading={isLoading} isError={isError} />
                                </div>
                                <div className="lg:w-[48%] w-[100%]">
                                    <div className="mb-4">
                                        <Steps />
                                    </div>
                                    <div>
                                        <Process />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Notifications />
                {/* tabs */}
                <Tabs selectedtab={selectedtab} setSelectedTab={setSelectedTab} data={data} isLoading={isLoading} isError={isError} protocolData={protocolData} />

            </div>

        </RootLayout>
    )
}

export async function getServerSideProps(context) {
    const data = await fetchArbiusData();
    console.log(data, "ARBIUS DATA");
    return {
        props: {
            protocolData: data,
        }
    }
}
