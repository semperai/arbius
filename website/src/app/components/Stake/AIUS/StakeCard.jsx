import React from 'react'
import { useContractRead, useAccount, useContractWrite, usePrepareContractWrite} from 'wagmi'
import { BigNumber } from 'ethers'
import baseTokenV1 from "../../../abis/baseTokenV1.json"
import config from "../../../../sepolia_config.json"
import votingEscrow from "../../../abis/votingEscrow.json"
import veStaking from "../../../abis/veStaking.json"
function StakeCard({idx, tokenID,getAPR, rewardRate, totalSupply, setSelectedStake, setShowPopUp}) {

    const {data:totalStaked, isLoading: totalStakedIsLoading, isError: totalStakedIsError} = useContractRead({
        address: VOTING_ESCROW_ADDRESS,
        abi: votingEscrow.abi,
        functionName: 'locked',
        args: [
          BigNumber.from(tokenID?._hex).toNumber()
        ]
      })
      const {data:endDate, isLoading: endDateIsLoading, isError: endDateIsError} = useContractRead({
        address: VOTING_ESCROW_ADDRESS,
        abi: votingEscrow.abi,
        functionName: 'locked__end',
        args: [
          BigNumber.from(tokenID?._hex).toNumber()
        ]
      })
      const {data:stakedOn, isLoading: stakedOnIsLoading, isError: stakedOnIsError} = useContractRead({
        address: VOTING_ESCROW_ADDRESS,
        abi: votingEscrow.abi,
        functionName: 'user_point_history__ts',
        args: [
          BigNumber.from(tokenID?._hex).toNumber(),
          1
        ]
      })
      const {data:governancePower, isLoading: governancePowerIsLoading, isError: governancePowerIsError} = useContractRead({
        address: VOTING_ESCROW_ADDRESS,
        abi: votingEscrow.abi,
        functionName: 'balanceOfNFT',
        args: [
          BigNumber.from(tokenID?._hex).toNumber()
        ]
      })

      


    
    return (
        <div className='rounded-2xl px-8 py-6  bg-white-background w-[40%] relative ' key={key}>
            <Image src={arbius_logo_slider} className='absolute top-2 right-2 w-[36px] h-[36px] z-20' alt="" />
            <div className='flex justify-start gap-8 items-start'>
                <div className='flex flex-col gap-3 justify-center items-start'>
                    <div>
                        <h2 className="text-[12px] text-[#8D8D8D] font-semibold">Total Staked</h2>
                        <h2 className='text-[15px] font-semibold'>{totalStaked?._hex ? BigNumber.from(totalStaked?._hex).toNumber() : 0} <span className="text-[11px] font-medium">AIUS</span></h2>
                    </div>
                    <div>
                        <h2 className="text-[12px] text-[#8D8D8D] font-semibold">APR</h2>
                        <h2 className='text-[15px] font-semibold'>{totalSupply?._hex && rewardRate?._hex ? getAPR(rewardRate?._hex, totalSupply?._hex).toFixed(2) : 0}%</h2>
                    </div>
                </div>
                <div className='flex flex-col gap-3 justify-center items-start'>
                    <div>
                        <h2 className="text-[12px] text-[#8D8D8D] font-semibold">Governance Power</h2>
                        <h2 className='text-[15px] font-semibold'>{governancePower?._hex ? BigNumber.from(governancePower?.data?._hex).toNumber() : 0}%</h2>
                    </div>
                    <div>
                        <h2 className="text-[12px] text-[#8D8D8D] font-semibold">Staked on</h2>
                        <h2 className='text-[15px] font-semibold'>{new Date(stakedOn?._hex).toLocaleString('en-US')}</h2>
                    </div>
                </div>

            </div>

            <div className='flex justify-start gap-12 items-center mt-3'>
                <div>
                    <h2 className="text-[12px] text-[#8D8D8D] font-semibold">End Date</h2>
                    <h2 className='text-[15px] font-semibold'>{new Date(endDate?.data?._hex).toLocaleString('en-US')}</h2>
                </div>
            </div>

            <div className='flex justify-between gap-2 items-center mt-4'>
                <div className='w-[32%]'>
                    <button
                        type="button"
                        onClick={() => { setShowPopUp("add"); setSelectedStake(tokenID); }}
                        className="relative justify-center py-2 group bg-[#F3F3F3] py-1 px-3 lg:px-4 rounded-full flex items-center gap-3 w-full"
                    >
                        <div className="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-4 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="lato-bold  relative z-10  text-black-text group-hover:text-original-white opacity-40 group-hover:opacity-100 lg:text-[15px]">
                            Add
                        </div>
                    </button>
                </div>
                <div className='w-[32%]'>
                    <button
                        type="button"
                        onClick={() => { setShowPopUp("extend"); setSelectedStake(tokenID?._hex); }}
                        className="relative justify-center py-2 group bg-[#F3F3F3] py-1 px-3 lg:px-4 rounded-full flex items-center gap-3 w-full"
                    >
                        <div className="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-4 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="lato-bold  relative z-10  text-black-text group-hover:text-original-white opacity-40 group-hover:opacity-100 lg:text-[15px]">
                            Extend
                        </div>
                    </button>
                </div>
                <div className='w-[32%]'>
                    <button
                        type="button"
                        onClick={() => { setShowPopUp("claim"); setSelectedStake(tokenID?._hex); }}
                        className="relative justify-center py-2 group bg-black-background py-1 px-3 lg:px-4 rounded-full flex items-center gap-3 w-full"
                    >
                        <div className="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-4 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="lato-bold  relative z-10 text-original-white lg:text-[15px]">
                            Claim
                        </div>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default StakeCard