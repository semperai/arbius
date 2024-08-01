import React, { useEffect, useState } from 'react'
// import Slider from './Slider'
import SlidingCards from './SlidingCards'
import Image from 'next/image'
import aius_icon from "../../../assets/images/aius_icon.png"
import gysr_logo_wallet from "../../../assets/images/gysr_logo_wallet.png"
import GanttChart from './GanttChart'
import { useContractRead } from 'wagmi'
import config from "../../../../sepolia_config.json"
import veStaking from "../../../abis/veStaking.json"
import votingEscrow from "../../../abis/votingEscrow.json"

// import { walletBalance } from '../../../Utils/getAiusBalance'

import { BigNumber } from 'ethers';
import { fetchArbiusData } from '../../../Utils/getArbiusData'

function DashBoard({ data, isLoading, isError, protocolData }) {
    // const { switchNetwork } = useSwitchNetwork({
    //     chainId: 421614,
    //   });
    const VE_STAKING_ADDRESS = config.veStakingAddress;
    const VOTING_ESCROW_ADDRESS = config.votingEscrowAddress;

    const walletBalance = data && !isLoading ? BigNumber.from(data._hex) / 1000000000000000000 : 0;
    // const [protocolData, setProtocolData] = useState([]);
    const rewardRate = useContractRead({
        address: VE_STAKING_ADDRESS,
        abi: veStaking.abi,
        functionName: 'rewardRate',
        args: [

        ]
    })

    const totalSupply = useContractRead({
        address: VE_STAKING_ADDRESS,
        abi: veStaking.abi,
        functionName: 'totalSupply',
        args: [

        ]
    })

    const getAPR = (rate, supply) => {
        rate = BigNumber.from(rate).toNumber()
        supply = BigNumber.from(supply).toNumber()
        const rewardPerveAiusPerSecond = rate / supply;
        let apr = rewardPerveAiusPerSecond * 31536000 // reward per second multiplied by seconds in an year
        apr = apr * 100; // APR percentage
        console.log(apr);
        if (apr) {
            return apr;
        }
        return 0;
    }

    const { data: veSupplyData, isLoading: veSupplyIsLoading, isError: veSupplyIsError } = useContractRead({
        address: VOTING_ESCROW_ADDRESS,
        abi: votingEscrow.abi,
        functionName: 'supply',
        args: [
        ]
    })


    console.log({ protocolData });


    return (
        <div className='xl:w-section-width w-mobile-section-width text-black-text mx-auto max-w-center-width py-10 lg:py-16' id="dashboard">
            <div className='flex justify-start items-baseline gap-3'><h1 className='text-[#4A28FF] lato-bold text-[40px]'><span className="hidden um:inline">veAIUS</span> Dashboard </h1> <Image src={aius_icon} width={"auto"} height={33} alt="" /></div>

            <div className='xl:grid grid-cols-3 gap-10 my-10 mt-14'>
                <div className="col-span-1 h-auto">

                    <div className='rounded-2xl p-8 bg-white-background stake-box-shadow h-full stake-box-shadow'>

                        <h1 className='text-[#4A28FF] text-[20px] font-semibold'>Wallet</h1>
                        <div className='grid grid-cols-2 gap-[1vw] 2xl:gap-[2vw] mt-6 xl:mt-8 mb-10'>

                            <div className='flex flex-col gap-8 justify-center items-start'>
                                <div>
                                    <h2 className="text-[14px]  text-[#8D8D8D] font-semibold">Balance</h2>
                                    <h2 className='text-[16px] 2xl:text-[18px] font-semibold mt-[2px]'>{walletBalance.toString()} <span className="text-[11px] font-medium">AIUS</span></h2>
                                </div>
                                <div>
                                    <h2 className="text-[14px] text-[#8D8D8D] font-semibold">Historical LP Profit</h2>
                                    <div className='flex justify-start items-center gap-2 mt-[2px]'> <h2 className='text-[16px] 2xl:text-[18px] font-semibold'>+ 41.12%</h2>
                                        <Image src={gysr_logo_wallet} width={22} height={22} alt="" />
                                    </div>
                                </div>
                            </div>
                            <div className='flex flex-col gap-8 justify-center items-start'>
                                <div>
                                    <h2 className="text-[14px] text-[#8D8D8D] font-semibold">Wallet TVL</h2>
                                    <h2 className='text-[16px] 2xl:text-[18px] font-semibold mt-[2px]'>$142.12</h2>
                                </div>
                                <div>
                                    <h2 className="text-[14px] text-[#8D8D8D] font-semibold">Estimated Total APR</h2>
                                    <h2 className='text-[16px] 2xl:text-[18px] font-semibold mt-[2px]'>{totalSupply.data?._hex && rewardRate.data?._hex ? getAPR(rewardRate.data?._hex, totalSupply.data?._hex).toFixed(2) : 0}%</h2>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='mt-10 xl:mt-0 col-span-2'>
                    <div className='pl-2'>
                        <div className='rounded-2xl px-8 py-3 w-full bg-white-background stake-box-shadow mb-2'>
                            <h1 className='text-[#4A28FF] text-[20px] font-semibold'>My Stakes</h1>
                        </div>
                    </div>
                    <div className=''>
                        <SlidingCards />
                    </div>
                </div>
            </div>
            <div className='hidden xl:grid grid-cols-1 xl:grid-cols-3 gap-10 mt-10'>
                <div className="col-span-1 block h-auto">
                    <div className='rounded-2xl py-8 px-2 um:p-8 bg-white-background stake-box-shadow h-full stake-box-shadow'>
                        <h1 className='text-[#4A28FF] text-[20px] font-semibold'>Protocol Info</h1>
                        <div className='grid grid-cols-2 gap-[1vw] 2xl:gap-[2vw] mt-6 xl:mt-8 mb-10'>
                            <div className='flex flex-col gap-8  justify-center items-start'>
                                <div>
                                    <h2 className="text-[14px]  text-[#8D8D8D] font-semibold">AIUS Staked</h2>
                                    <h2 className='text-[16px] 2xl:text-[18px] font-semibold mt-[2px]'>{!veSupplyIsLoading && veSupplyData ? BigNumber.from(veSupplyData?._hex).toString() : 0}</h2>
                                </div>
                                <div>
                                    <h2 className="text-[14px]  text-[#8D8D8D] font-semibold">Total Supply</h2>
                                    <h2 className='text-[16px] 2xl:text-[18px] font-semibold mt-[2px]'>{protocolData?.data?.AIUS?.total_supply.toLocaleString()} <span className="text-[11px] font-medium">AIUS</span></h2>
                                </div>
                            </div>
                            <div className='flex flex-col gap-8  justify-center items-start'>
                                <div>
                                    <h2 className="text-[14px]  text-[#8D8D8D] font-semibold">AIUS Market Cap</h2>
                                    <h2 className='text-[16px] 2xl:text-[18px] font-semibold mt-[2px]'>${new Intl.NumberFormat('en-US', {
                                        notation: 'compact',
                                        compactDisplay: 'short'
                                    }).format(protocolData?.data?.AIUS?.self_reported_market_cap)} </h2>
                                </div>
                                <div>
                                    <h2 className="text-[14px]  text-[#8D8D8D] font-semibold">Circulating supply</h2>
                                    <h2 className='text-[16px] 2xl:text-[18px] font-semibold mt-[2px]'>{protocolData?.data?.AIUS?.self_reported_circulating_supply.toFixed(0)} <span className="text-[11px] font-medium">AIUS</span></h2>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='hidden xl:block col-span-2 pl-2 h-full'>
                    <GanttChart />
                </div>
            </div>
        </div>
    )
}

export default DashBoard