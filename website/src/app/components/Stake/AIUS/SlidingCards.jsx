import React, { useRef, useState, useEffect } from 'react'
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import Image from "next/image"
import arrow_prev from "../../../assets/images/arrow_slider_2.png"
import PopUp from './PopUp';
import cross_icon from "../../../assets/images/cross_icon.png"
import arbius_logo_without_name from '@/app/assets/images/arbius_logo_without_name.png'
import ReactSlider from 'react-slider'
import info_icon from "../../../assets/images/info_icon.png"
import arbius_logo_slider from '@/app/assets/images/arbius_logo_slider.png'
import config from "../../../../sepolia_config.json"
import veStaking from "../../../abis/veStaking.json"
import votingEscrow from "../../../abis/votingEscrow.json"
import { getAPR } from "../../../Utils/getAPR"
import { useAccount, useContractRead, useContractReads, usePrepareContractWrite, useContractWrite } from 'wagmi';
import { BigNumber } from 'ethers';
import baseTokenV1 from "../../../abis/baseTokenV1.json"
import StakeCard from './StakeCard';
import { AIUS_wei, t_max } from "../../../Utils/constantValues";

    const AddPopUpChildren = ({ setShowPopUp, selectedStake,  walletBalance, totalSupply, rewardRate, getAPR}) => {

        const [aiusToStake, setAIUSToStake] = useState(0);
        const [estBalance, setEstBalance] = useState(0);

        const VOTING_ESCROW_ADDRESS = config.votingEscrowAddress;
        console.log(Number(selectedStake), "SELC")
        const { config: addAIUSConfig } = usePrepareContractWrite({
            address: VOTING_ESCROW_ADDRESS,
            abi: votingEscrow.abi,
            functionName: 'increase_amount',
            args: [
                Number(selectedStake),
                (aiusToStake * AIUS_wei).toString()
            ],
            enabled: Boolean(aiusToStake)
        });

        const {
            data: addAIUSData,
            isLoading: addAIUSIsLoading,
            isSuccess: addAIUSIsSuccess,
            write: addAIUS
        } = useContractWrite(addAIUSConfig)


        const {data:endDate, isLoading: endDateIsLoading, isError: endDateIsError} = useContractRead({
            address: VOTING_ESCROW_ADDRESS,
            abi: votingEscrow.abi,
            functionName: 'locked__end',
            args: [
                Number(selectedStake)
            ]
        })
        console.log(Number(endDate?._hex), "endDate")
        const {data:stakedOn, isLoading: stakedOnIsLoading, isError: stakedOnIsError} = useContractRead({
            address: VOTING_ESCROW_ADDRESS,
            abi: votingEscrow.abi,
            functionName: 'user_point_history__ts',
            args: [
                Number(selectedStake),
                1
            ]
        })
        const {data:totalStaked, isLoading: totalStakedIsLoading, isError: totalStakedIsError} = useContractRead({
            address: VOTING_ESCROW_ADDRESS,
            abi: votingEscrow.abi,
            functionName: 'locked',
            args: [
                Number(selectedStake)
            ]
        })

        useEffect(() => {
            if(totalStaked && endDate && stakedOn){
                console.log(Number(endDate?._hex), "YOLO")
                const t = (Number(endDate?._hex) - Number(stakedOn?._hex));
                const a_b = (Number(totalStaked?.amount?._hex) / AIUS_wei) + Number(aiusToStake)
                setEstBalance(a_b * (t / t_max));
            }
        },[aiusToStake])

        return (
            <>
                <div className='flex justify-between items-center my-2'>
                    <div className='flex justify-start items-center gap-3'>
                        <h1>Add AIUS</h1>
                    </div>
                    <div className='cursor-pointer' onClick={() => setShowPopUp(false)}>
                        <Image src={cross_icon} className='w-[10px] h-[10px]' alt="" />
                    </div>

                </div>

                <div className='my-4'>
                    <div className="border border-[#2F2F2F] rounded-3xl flex items-center">
                        <div className="bg-stake-input flex items-center gap-2 justify-center rounded-l-3xl  p-1 px-2 box-border">
                            <div className="bg-white-background w-[30px] h-[30px] rounded-[50%] flex items-center justify-center ">
                                <Image src={arbius_logo_without_name} width={15} alt="arbius"  />
                            </div>
                            <p className="pr- text-aius lato-bold text-[12px]">AIUS</p>
                        </div>
                        <div className="w-[94%]">
                            <input className="w-[100%] border-0 outline-none rounded-r-3xl p-1 px-2 lato-bold text-[15px] border-none focus:ring-0 " type="number" placeholder="0.0" value={aiusToStake} onChange={(e)=>setAIUSToStake(e.target.value)} />
                        </div>
                    </div>
                    <h1 className='text-[0.6rem] opacity-50 my-1'>Available AIUS {walletBalance.toString()}</h1>
                </div>
                <div className='flex justify-center gap-2 items-center'>
                    <div className='w-full bg-[#EEEAFF] p-3 py-6 rounded-2xl'>

                        <h1 className='text-xs'><span className='text-[20px] text-purple-text'>{estBalance?.toFixed(2).toString()}</span> veAIUS</h1>
                        <h1 className='text-[.6rem]'>Est. veAIUS balance</h1>
                    </div>
                    <div className='w-full bg-[#EEEAFF] p-3 py-6 rounded-2xl'>

                        <h1 className='text-xs'><span className='text-[20px] text-purple-text'>{totalSupply?._hex && rewardRate?._hex ? getAPR(rewardRate?._hex, totalSupply?._hex).toFixed(2) : 0}</span>%</h1>
                        <h1 className='text-[0.6rem]'>APR</h1>

                    </div>

                </div>

                <div className='flex justify-end gap-2 mt-16'>
                    <button
                        type="button"
                        className="relative group bg-[#F1F0F3] py-1 px-3 lg:px-5 rounded-full flex items-center gap-3 "
                        onClick={() => setShowPopUp(false)}
                    >
                        <div className="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-5 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="lato-bold  relative z-10 text-opacity-40 mb-[1px] text-black-text group-hover:text-original-white lg:text-[100%]">
                            Cancel
                        </div>

                    </button>
                    <div className='flex justify-end'>
                        <button
                            type="button"
                            className="relative group bg-black-background py-1 px-7 rounded-full flex items-center gap-3"
                            onClick={()=>addAIUS?.()}
                        >
                            <div className="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-5 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="lato-bold  relative z-10 text-original-white lg:text-[100%] mb-[1px]">
                                Add
                            </div>
                        </button>


                    </div>

                </div>
            </>
        )
    }

    const ExtendPopUpChildren = ({ setShowPopUp, selectedStake }) => {
        const [sliderValue, setSliderValue] = useState(0)
        const [duration, setDuration] = useState({
            months: 0,
            weeks: 0
        })
        
        function getCurrentTimeInMSeconds() {
            const now = new Date();
            return Math.floor(now.getTime());
        }

        const VOTING_ESCROW_ADDRESS = config.votingEscrowAddress;
        const {data:endDate, isLoading: endDateIsLoading, isError: endDateIsError} = useContractRead({
            address: VOTING_ESCROW_ADDRESS,
            abi: votingEscrow.abi,
            functionName: 'locked__end',
            args: [
              Number(selectedStake)
            ]
        })

        console.log(endDate, "END DATE")
        let currentlyEndingAt = new Date(Number(endDate?._hex) * 1000).toLocaleDateString("en-US");
        let currentDate = new Date().toLocaleDateString("en-US");

        const [currentEndDate, setCurrentEndDate] = useState(new Date(currentlyEndingAt))
        const [extendStartDate, setExtendStartDate] = useState(new Date(currentDate))

        let datePlus24Months = new Date();
        datePlus24Months.setMonth(datePlus24Months.getMonth() + 24);
        const currentlyEndingDate = new Date(currentlyEndingAt)
        const numberOfMonths = (datePlus24Months.getFullYear() - currentlyEndingDate.getFullYear()) * 12 + (datePlus24Months.getMonth() - currentlyEndingDate.getMonth());
        console.log(numberOfMonths, "NO OF")
        const [extendEndDate, setExtendEndDate] = useState(new Date(currentlyEndingAt))
        console.log(sliderValue, "SLIDER VAL", ((extendEndDate - getCurrentTimeInMSeconds()) / 1000))
        const { config: addAIUSConfig } = usePrepareContractWrite({
            address: VOTING_ESCROW_ADDRESS,
            abi: votingEscrow.abi,
            functionName: 'increase_unlock_time',
            args: [
                Number(selectedStake),
                parseInt((extendEndDate - getCurrentTimeInMSeconds()) / 1000).toString() // value in months(decimal) * 4*7*24*60*60
            ],
        });

        const {
            data: addAIUSData,
            isLoading: addAIUSIsLoading,
            isSuccess: addAIUSIsSuccess,
            write: extendAIUS
        } = useContractWrite(addAIUSConfig)
        console.log({addAIUSData})
        return (

            <>
                <div className='flex justify-between items-center my-2'>
                    <div className='flex justify-start items-center gap-3'>

                        <h1>Extend</h1>
                    </div>
                    <div className='cursor-pointer' onClick={() => setShowPopUp(false)}>
                        <Image src={cross_icon} className='w-[10px] h-[10px]' alt="" />
                    </div>

                </div>

                <div className='my-6'>

                    <ReactSlider
                        className=" text-original-white border-b border-4 border-[#ECECEC] rounded-2xl"
                        thumbClassName=" w-[28px] h-[28px] ml-[-6px] bg-thumb cursor-pointer rounded-[50%] flex items-center justify-center border-0 mt-[-14px] outline-none"
                        markClassName="customSlider-mark"
                        marks={4}
                        min={0}
                        step={.25}
                        max={numberOfMonths}
                        defaultValue={0}
                        value={sliderValue}
                        onChange={(value) => {
                            if (value < 1) {
                                setDuration({ ...duration, months: 0, weeks: 4 * value })
                            } else {
                                setDuration({ ...duration, months: value, weeks: 0 })
                                // setExtendEndDate(new Date(currentEndDate.getFullYear(), currentEndDate.getMonth() + value, currentEndDate.getDate()))
                            }
                            let date;
                            if (Number.isInteger(value)) {
                                date = new Date(currentEndDate?.getFullYear(), currentEndDate?.getMonth() + value, currentEndDate?.getDate());
                            } else {
                                date = new Date(currentEndDate?.getFullYear(), currentEndDate?.getMonth(), currentEndDate?.getDate() + 30 * value);
                            }
                            setExtendEndDate(date)
                            setSliderValue(value)
                        }}
                        renderMark={(props) => {
                            props.className = "customSlider-mark customSlider-mark-before text-[16px] text-start ml-[0px] w-[16.66%]";
                            return <span {...props} >
                                <h1>{props.key}</h1>
                            </span>;
                        }}
                    />

                </div>
                <div className='flex justify-center gap-2 items-center mt-20'>
                    <div className='w-full bg-[#EEEAFF] p-3 py-4 rounded-md'>
                        {console.log(currentEndDate, "EXTSTART")}

                        <h1 className='text-xs text-purple-text font-semibold'>{currentEndDate?.getMonth() + 1}/{currentEndDate?.getDate()}/{currentEndDate?.getFullYear()}</h1>
                        <h1 className='text-[.6rem]'>Current Stake ends at</h1>
                    </div>
                    <div className='w-full bg-[#EEEAFF] p-3 py-4 rounded-md'>

                        <h1 className='text-xs text-purple-text font-semibold'>{extendEndDate?.getMonth() + 1}/{extendEndDate?.getDate()}/{extendEndDate?.getFullYear()}</h1>
                        <h1 className='text-[.6rem]'>Stake extended till</h1>
                    </div>

                </div>

                <div className='border-2 rounded-xl  p-4 gap-3 flex justify-start items-center mt-4'>
                    <Image src={info_icon} width={14} height={14} alt="" />
                    <h1 className='text-[0.66rem]  text-purple-text'>An extension&apos;s duration cannot exceed a two year maximum</h1>
                </div>

                <div className='flex justify-end gap-2 mt-4'>
                    <button
                        type="button"
                        className="relative group bg-[#F1F0F3] py-1 px-3 lg:px-5 rounded-full flex items-center gap-3 "
                        onClick={() => setShowPopUp(false)}
                    >
                        <div className="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-5 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="lato-bold  relative z-10 text-opacity-40 text-black-text group-hover:text-original-white lg:text-[100%]">
                            Cancel
                        </div>

                    </button>
                    <div className='flex justify-end'>

                        <button
                            type="button"
                            onClick={()=> extendAIUS?.()}
                            className="relative group bg-black-background py-1 px-3 lg:px-5 rounded-full flex items-center gap-3 "
                        >
                            <div className="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-5 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="lato-bold  relative z-10 text-original-white lg:text-[100%]">
                                Extend
                            </div>

                        </button>


                    </div>

                </div>
            </>
        )
    }


    const ClaimPopUpChildren = ({ setShowPopUp, selectedStake }) => {

        const VE_STAKING_ADDRESS = config.veStakingAddress;

       
            const {data: claimRewardData, isLoading: claimRewardIsLoading, isError: claimRewardIsError} = useContractRead({
                address: VE_STAKING_ADDRESS,
                abi: veStaking.abi,
                functionName: 'getReward',
                args: [
                    Number(selectedStake)
                ]
            })
            console.log(claimRewardData, "CRD", selectedStake)

        return <>
            <div className='flex justify-between items-center my-2'>
                <div className='flex justify-start items-center gap-3'>

                    <h1>Claim</h1>
                </div>
                <div className='cursor-pointer' onClick={() => setShowPopUp(false)}>
                    <Image src={cross_icon} className='w-[10px] h-[10px]' alt="" />
                </div>

            </div>


            <div className='flex justify-center gap-2 items-center mt-6'>
                <div className='w-full bg-[#EEEAFF] text-center p-3 py-6 rounded-md'>
                    <h1 className='text-xs '><span className='text-purple-text font-semibold text-[30px]'>{Number(claimRewardData?._hex) ? Number(claimRewardData?._hex).toString() : 0}</span> AIUS</h1>
                    <h1 className='text-[.6rem] mt-2'>Claimable AIUS</h1>
                </div>


            </div>

            <div className='border-2 rounded-xl  p-4 gap-3 flex justify-start items-center mt-4'>
                <Image src={info_icon} width={14} height={14} alt="" />
                <h1 className='text-[0.66rem]  text-purple-text'>AIUS is claimable directly to your wallet </h1>
            </div>

            <div className='flex justify-end gap-2 mt-12'>

                <button
                    type="button"
                    className="relative group bg-[#F1F0F3] py-1 px-3 lg:px-5 rounded-full flex items-center gap-3 "
                    onClick={() => setShowPopUp(false)}
                >
                    <div className="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-5 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="lato-bold  relative z-10 text-opacity-40 text-black-text group-hover:text-original-white lg:text-[100%]">
                        Cancel
                    </div>

                </button>

                <div className='flex justify-end'>

                    <button
                        type="button"
                        className="relative group bg-black-background py-1 px-3 lg:px-5 rounded-full flex items-center gap-3 "
                    >
                        <div className="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-5 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="lato-bold  relative z-10 text-original-white lg:text-[100%]">
                            Claim
                        </div>

                    </button>


                </div>

            </div>
        </>

    }



function SlidingCards() {
    const [showPopUp, setShowPopUp] = useState(false)
    const sliderRef = useRef()
    const [direction, setDirection] = useState("");
    const [selectedStake, setSelectedStake] = useState({});

    const VOTING_ESCROW_ADDRESS = config.votingEscrowAddress;
    const VE_STAKING_ADDRESS = config.veStakingAddress;
    const BASETOKEN_ADDRESS_V1 = config.v2_baseTokenAddress;

    const { address, isConnected } = useAccount()
    const [totalEscrowBalance, setTotalEscrowBalance] = useState(0)
    const [totalStakes, setTotalStakes] = useState([])

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

    const walletBalance = data && !isLoading ? BigNumber.from(data._hex) / 1000000000000000000 : 0;

    const { data: escrowBalanceData, isLoading: escrowBalanceIsLoading, isError: escrowBalanceIsError } = useContractRead({
        address: VOTING_ESCROW_ADDRESS,
        abi: votingEscrow.abi,
        functionName: 'balanceOf',
        args: [
            address
        ],
        enabled: isConnected
    })

    console.log(escrowBalanceData, "VEBALANCE")

    const {data:rewardRate, isLoading: rewardRateIsLoading, isError: rewardRateIsError} = useContractRead({
        address: VE_STAKING_ADDRESS,
        abi: veStaking.abi,
        functionName: 'rewardRate',
        args: [],
        enabled: isConnected
    })

    const {data:totalSupply, isLoading: totalSupplyIsLoading, isError: totalSupplyIsError} = useContractRead({
        address: VE_STAKING_ADDRESS,
        abi: veStaking.abi,
        functionName: 'totalSupply',
        args: [],
        enabled: isConnected
    })
    console.log(rewardRate, totalSupply, "RRTS")

    const { data: tokenIDs, isLoading: tokenIDsIsLoading, isError: tokenIDsIsError } = useContractReads({
        contracts: (totalEscrowBalance) ? new Array(totalEscrowBalance).fill(0).map((i, index) => {
            console.log("the loop", i, totalEscrowBalance)
          return {
            address: VOTING_ESCROW_ADDRESS,
            abi: votingEscrow.abi,
            functionName: 'tokenOfOwnerByIndex',
            args: [
              address,
              index
            ]
          }
        }) : null,
    });
    console.log(tokenIDs, "tokenIDs")




    useEffect(() => {
        console.log(escrowBalanceData, "ESCROW")
        if (escrowBalanceData) {
            setTotalEscrowBalance(BigNumber.from(escrowBalanceData?._hex).toNumber())
        }
    }, [escrowBalanceData])

    


    var settings = {
        dots: false,
        infinite: false,
        speed: 500,
        slidesToShow: tokenIDs?.length > 2 ? 2.3 : 2,
        slidesToScroll: 1,
        nextArrow: tokenIDs?.length > 2 ? <NextBtn /> : null,
        prevArrow: tokenIDs?.length > 2 ? <PrevBtn /> : null,
        responsive: [
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: tokenIDs?.length > 1 ? 1.5 : tokenIDs?.length,
                    slidesToScroll: 1,
                    nextArrow: tokenIDs?.length > 1 ? <NextBtn /> : null,
                    prevArrow: tokenIDs?.length > 1 ? <PrevBtn /> : null,
                }
            },
            {
                breakpoint: 475,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    nextArrow: tokenIDs?.length > 1 ? <NextBtn /> : null,
                    prevArrow: tokenIDs?.length > 1 ? <PrevBtn /> : null,
                }
            },
        ]
    };

    function PrevBtn(props) {
        const { className, style, onClick } = props;
        if (className.includes("slick-disabled")) {
            setDirection("right");
        }
        return (
            <div
                className={`absolute top-[40%]  left-[-22px] cursor-pointer rounded-full  z-20 bg-white-background p-3 w-[45px] h-[45px] border-2  flex justify-center items-center`}

                onClick={onClick}
            >
                <Image src={arrow_prev} className='mr-[2px]' width={10} height={10} alt="" />

            </div>
        );
    }

    function NextBtn(props) {
        const { className, style, onClick } = props;
        if (className.includes("slick-disabled")) {
            setDirection("left");
        }
        return (
            <div
                className={`absolute top-[40%] rounded-full  right-[-20px] cursor-pointer  bg-white-background p-3 w-[45px] h-[45px] border-2  flex justify-center items-center`}

                onClick={onClick}
            >
                <Image src={arrow_prev} className='rotate-180 ml-[2px]' width={10} height={10} alt="" />
            </div>
        );

    }


    useEffect(() => {
        console.log(direction, "direction")
        const elements = document.querySelectorAll('.slick-list');
        if(tokenIDs?.length > 2){
            elements.forEach(element => {
                if (direction == "right") {
                    element.style.boxShadow = '10px 0 5px -4px rgba(18, 0, 117, 0.077)';
                } else if (direction == "left") {
                    element.style.boxShadow = '-10px 0 5px -4px rgba(18, 0, 117, 0.077)';
                }
            });
        }
    }, [direction]);
    // console.log({totalStakes});

    return (
        <div>
            {showPopUp !== false && (
                <PopUp setShowPopUp={setShowPopUp}>
                    {showPopUp === "add" && <AddPopUpChildren setShowPopUp={setShowPopUp} selectedStake={selectedStake} walletBalance={walletBalance} totalSupply={totalSupply} rewardRate={rewardRate} getAPR={getAPR} setSelectedStake={setSelectedStake} />}
                    {showPopUp === "claim" && <ClaimPopUpChildren setShowPopUp={setShowPopUp}  selectedStake={selectedStake} />}
                    {showPopUp === "extend" && <ExtendPopUpChildren setShowPopUp={setShowPopUp}  selectedStake={selectedStake} />}
                </PopUp>
            )}
            <div className='relative'>
                <div className='  pl-2  w-full flex justify-start  items-center  relative ' ref={sliderRef}>
                    <Slider {...settings}>
                        {tokenIDs?.map((item, key) => (
                            <StakeCard tokenID={item} rewardRate={rewardRate} totalSupply={totalSupply} getAPR={getAPR} key={key} setSelectedStake={setSelectedStake} setShowPopUp={setShowPopUp} />
                        ))}
                    </Slider>
                </div>
            </div>
        </div>
    )
}
export default SlidingCards