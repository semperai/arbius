import React, { useEffect } from 'react'
import { useState } from 'react'
import walletImage from '../../../assets/images/ion_wallet-outline.png'
import Image from 'next/image'
import Popup from './Popup'
import HintBox from '../../HintBox/Hintbox'
import { approveUNIV2 } from '../../../Utils/approveUniv2'
import { stakeTokens } from '../../../Utils/staking'
import { connectWalletHandler } from '../../../Utils/connectWallet'
import { claimTokens } from '../../../Utils/claim'
import { unstakeTokens } from '../../../Utils/unstake'
import { claimableRewards } from '../../../Utils/claimableRewards'
import { stakeTokenBalance } from '../../../Utils/stakedTokenBalance'
function Stake() {
    const [currentHoverId, setCurrentHoverId] = useState(null);
    const [isStakeClicked, setIsStakeClicked] = useState(false)
    const [isPopupOpen, setIsPopupOpen] = useState(false)
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
      const getData=async()=>{
        const data1=await stakeTokenBalance()
        const data2=await claimableRewards()
        setData({
            unstake:{
                rewards:data2[0],
                balance:data1[0],
            }
        })
        console.log(data1,data2,"kokokokokokok")
      }
      getData()
    }, [])
    
    const handleApproveClick = async()=>{
        if(!document)
            return 
        let body = document.getElementsByTagName("body");
        body[0].style.overflow = "hidden"
        // setIsPopupOpen(true);
        // alert("clicked")
        await connectWalletHandler()
            
        const approved =await approveUNIV2('1')
        if(approved){
            stakeTokens('1')
        }
    }
    const connectWallet=async()=>{
        
        const connct= await connectWalletHandler()
        if(connct){
            setIsStakeClicked(true)
        }
    }
    
    useEffect(()=>{
        if(isPopupOpen == false){

            if(!document)
                return 
            let body = document.getElementsByTagName("body");
            body[0].style.overflow = "auto"
        }

    },[isPopupOpen])
    
    function convertLargeNumber(numberStr) {
        // Convert the string to a BigInt
        let number = BigInt(0);
    
        // Divide the large number by 10^20 and convert it to a floating-point number
        let scaledNumber = (Number(number) / 1e20).toFixed(2);
    
        return scaledNumber;
    }
    return (
        <>
            {isPopupOpen && <Popup isPopupOpen={isPopupOpen} setIsPopupOpen={setIsPopupOpen}/>}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-mobile-section-width lg:w-[90%] m-[auto]">

                {isStakeClicked || localStorage.getItem('walletConnected') ? (<>
                    <div className="rounded-2xl p-6 lg:p-10 flex flex-col justify-between h-[auto] bg-white-background stake-card">
                        <div>
                            <h1 className="text-[15px] lg:text-[20px] font-medium text-[#4A28FF]">Stake</h1>
                            <div className="flex justify-start items-end mt-6 gap-20">

                                <div className='flex flex-col justify-center text-[#101010]'>
                                    <div className="flex justify-start items-baseline">
                                        <h1 className="text-[25px] lg:text-[30px] font-medium">0.000</h1>
                                        <p className="text-para ">Uni-V2</p>
                                    </div>
                                    <h1 className="text-[8px] lg:text-[13px] font-medium">Wallet Balance</h1>

                                </div>


                                <div className='flex flex-col justify-center text-[#101010]'>
                                    <div className="flex justify-start items-baseline" id="BonusPeriod">
                                        <h1 className="text-[25px] lg:text-[30px] font-medium">90</h1>
                                        <p className="text-para ">Days</p>
                                    </div>

                                    <h1 className="text-[8px] lg:text-[13px] font-medium ">Bonus Period</h1>
                                    <HintBox
                                        content={"The multiplier on your stake will increase from 1.00x to 3.00x over 90 days"}
                                        customStyle={{}}
                                        link={null}
                                        boxStyle={{ width: '200px', top: '50%', zIndex: 10 }}
                                        hoverId={"BonusPeriod"}
                                        currentHoverId={currentHoverId}
                                        setCurrentHoverId={setCurrentHoverId}
                                    />
                                </div>

                            </div>
                            <div className="rounded-[25px]  flex justify-center w-[100%] mt-6 text-[#101010]">
                                <input className="p-2 lg:p-3 border-[1px] border-r-0 rounded-l-[25px] rounded-r-none w-[70%] focus:outline-none bg-original-white" placeholder="Amount of UNI-V2 to stake" />
                                <div className="p-2 lg:p-3 w-[30%] rounded-r-[25px] rounded-l-none  border-[1px] border-l-0 bg-[#E6DFFF] flex justify-center gap-2 lg:gap-4 items-center">
                                    <h className="text-[10px] lg:text-[15px] font-medium">UNI-V2</h>
                                    <div className=" bg-[#5E40FD] rounded-full px-3 py-[1px] text-original-white flex items-center">
                                        <p className="text-[6px] lg:text-[12px] pb-[2px]">max</p>
                                    </div>
                                </div>
                            </div>

                        </div>


                        <div className="flex justify-end items-center gap-4 mt-4 md:mb-0 text-[#101010]">
                            <button type="button" className="relative group bg-black-background py-2  px-8 rounded-full flex items-center  gap-3"
                              id={"approveUniV2"}
                              onClick={() =>{
                                handleApproveClick()
                            }}>
                                <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-8 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <p className="relative z-10 text-original-white text-[13px] mb-[2px]">Approve SUNI-V2</p>
                                <HintBox
                                        content={"Approve the Pool to access $UNI-V2 in your wallet in order to stake"}
                                        customStyle={{'arrowLeft':'40%'}}
                                        link={null}
                                        boxStyle={{ width: '200px', top: '50%', zIndex: 10 }}
                                        hoverId={"approveUniV2"}
                                        currentHoverId={currentHoverId}
                                        setCurrentHoverId={setCurrentHoverId}
                                    />
                            </button>
                            
                            <button type="button" className="relative group bg-[#121212] py-2 bg-opacity-5 px-8 rounded-full flex items-center  gap-3" onClick={() => connectWallet()}>
                                <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-8 rounded-full  opacity-0  transition-opacity duration-500"></div>
                                <p className="relative z-10 text-[#101010] opacity-30 text-[15px] mb-[2px]">Stake</p>
                            </button>
                        </div>

                    </div>

                    <div className="rounded-2xl p-6 lg:p-10 flex flex-col justify-between h-[auto] bg-white-background stake-card">

                        <div>
                            <h1 className="text-[15px] lg:text-[20px] text-[#4A28FF] font-medium">Unstake</h1>
                            <div className="flex justify-start items-end mt-6 mb-8 gap-[40px] text-[#101010]">

                                <div className='bg-[#EEEAFF] p-4 rounded-lg' >
                                    <div id="unstakeBalance" className="flex justify-start items-baseline">
                                        <h1 className="text-[25px] lg:text-[30px]  text-[#4A28FF]">{convertLargeNumber(String(data?.unstake.balance))}&nbsp;</h1>
                                        <p className="text-para ">Uni-V2</p>
                                        <HintBox
                                        content={"Total UNI-V2 you have staked in this Pool"}
                                        customStyle={{}}
                                        link={null}
                                        boxStyle={{ width: '200px', top: '50%', zIndex: 10 }}
                                        hoverId={"unstakeBalance"}
                                        currentHoverId={currentHoverId}
                                        setCurrentHoverId={setCurrentHoverId}
                                    />
                                    </div>
                                    <h1 className="text-[8px] lg:text-[13px] font-medium">Wallet Balance</h1>
                                </div>
                                

                                <div className='bg-[#EEEAFF] p-4 rounded-lg '>
                                    <div  id="claimableRewards" className="flex justify-start items-baseline">
                                        <h1 className="text-[25px] lg:text-[30px] text-[#4A28FF]">{convertLargeNumber(String(data?.unstake.rewards))}&nbsp;</h1>
                                        <p className="text-para ">AIUS</p>
                                        <HintBox
                                        content={"Your estimated rewards if you unstake now"}
                                        customStyle={{}}
                                        link={null}
                                        boxStyle={{ width: '200px', top: '50%', zIndex: 10 }}
                                        hoverId={"claimableRewards"}
                                        currentHoverId={currentHoverId}
                                        setCurrentHoverId={setCurrentHoverId}
                                    />
                                    </div>
                                    <h1  className=" text-[#101010] text-[8px] lg:text-[13px] font-medium">Claimable Rewards</h1>


                                </div>
                                

                            </div>

                            <hr className="opacity-10" />

                            <div className="flex justify-start gap-[50px] mt-4 text-[#101010] ">
                                <div >

                                    <div className='flex flex-row gap-1 '>
                                    <h1 className="text-[18px] text-[#4A28FF]">382</h1>
                                    <h1 className='text-[14px] self-end '>AIUS</h1>
                                    </div>
                                    <h2 className="text-[15px] font-medium" id="globalUnlocked">Global Unlocked</h2>
                                    <HintBox
                                    content={"Total AIUS currently unlocked for entire pool. This number is important to keep an eye on for timing your unstakes."}
                                    customStyle={{'arrowLeft':'50%','marginBottom':'80px'}}
                                    link={null}
                                    boxStyle={{ width: '200px', top: '0%', zIndex: 10 }}
                                    hoverId={"globalUnlocked"}
                                    currentHoverId={currentHoverId}
                                    setCurrentHoverId={setCurrentHoverId}
                                    />
                                </div>
                                <div >

                                    <div className='flex flex-row gap-1 text-[#101010]'>
                                    <h1 className="text-[18px] text-[#4A28FF]">1.25x</h1>
                                    </div>
                                    <h2 className="text-[15px] font-medium">Total Mult</h2>

                                </div>
                                <div >

                                    <div className='flex flex-row gap-1'>
                                    <h1 className="text-[18px] text-[#4A28FF]">10</h1>
                                    <h1 className='text-[14px] self-end'>days</h1>
                                    </div>
                                    <h2 className="text-[15px] font-medium">Time Staked</h2>

                                </div>
                            </div>
                            <div className="rounded-[25px]  flex justify-center w-[100%] mt-6 text-[#101010]">
                                <input className="p-2 lg:p-3 border-[1px] border-r-0 rounded-l-[25px] rounded-r-none w-[70%] focus:outline-none bg-original-white" placeholder="Amount of UNI-V2 to stake" />
                                <div className="p-2 lg:p-3 w-[30%] rounded-r-[25px] rounded-l-none  border-[1px] border-l-0 bg-[#E6DFFF] flex justify-center gap-2 lg:gap-4 items-center">
                                    <h className="text-[10px] lg:text-[15px] font-medium">UNI-V2</h>
                                    <div className=" bg-[#5E40FD] rounded-full px-3 py-[1px] text-original-white flex items-center">
                                        <p className="text-[6px] lg:text-[12px] pb-[2px]">max</p>
                                    </div>
                                </div>


                            </div>
                            <div className="flex justify-between items-end text-[#101010]">
                                <div className="w-[70%] flex justify-between items-end gap-4">
                                    <div className="rounded-[25px]  flex justify-center w-[100%] mt-6">
                                        <input className="p-2 lg:p-3 border-[1px] border-r-0 rounded-l-[25px] rounded-r-none w-[70%] focus:outline-none bg-original-white" placeholder="0" />
                                        <div className="p-2 lg:p-3 w-[50%] rounded-r-[25px] rounded-l-none  border-[1px] border-l-0 bg-[#E6DFFF] flex justify-center gap-2 lg:gap-4 items-center">
                                            <h className="text-[10px] lg:text-[15px] font-medium">GYSR</h>
                                            <div className=" bg-[#5E40FD] rounded-full px-3 py-[1px] text-original-white flex items-center">
                                                <p className="text-[6px] lg:text-[12px] pb-[2px]">max</p>
                                            </div>
                                        </div>


                                    </div>
                                    <div id="multiplyQuotient">
                                        <h1 className="text-[30px] font-medium">1.00x</h1>
                                    </div>
                                    <HintBox
                                        content={"By spending GYSR you will multiply the number of share seconds that you have accrued"}
                                        customStyle={{'arrowLeft':'35%'}}
                                        link={null}
                                        boxStyle={{ width: '200px', top: '50%', zIndex: 10 }}
                                        hoverId={"multiplyQuotient"}
                                        currentHoverId={currentHoverId}
                                        setCurrentHoverId={setCurrentHoverId}
                                    />
                                </div>

                                <div className="text-[#101010] text-[16px] font-medium mt-4 pr-4">
                                    <h1 className="">You&apos;ll Receive <span className='text-opacity-10 text-[12px]'>0.000 AIUS</span></h1>

                                </div>


                            </div>

                            <div className="flex justify-end items-center gap-4 mt-6">
                                <button type="button" className="relative group bg-[#121212] py-2 bg-opacity-5 px-8 rounded-full flex items-center  gap-3"
                                onClick={()=>claimTokens()}>
                                    <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-8 rounded-full  opacity-0  transition-opacity duration-500"></div>
                                    <p className="relative z-10 text-[#101010] opacity-30 text-[15px]  mb-[1px]">Claim</p>

                                </button>
                                <button type="button" className="relative group bg-[#121212] py-2 bg-opacity-5 px-8 rounded-full flex items-center  gap-3"
                                 onClick={()=>unstakeTokens()}>
                                    <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-8 rounded-full  opacity-0  transition-opacity duration-500"></div>
                                    <p className="relative z-10 text-[#101010] opacity-30 text-[15px]  mb-[1px]">Unstake & Claim</p>

                                </button>
                            </div>
                        </div>



                    </div>

                </>) : (<>
                    <div className="rounded-2xl p-6 lg:p-10 flex flex-col justify-between h-[350px] lg:h-[auto] bg-white-background stake-card">
                        <div>
                            <h1 className="text-[15px] lg:text-[20px] font-medium">Stake</h1>
                            <p className="text-[11px] lg:text-para mt-6">Please connect a wallet to interact with this pool!</p>
                        </div>


                        <div className="flex justify-center items-center lg:mt-16 lg:mb-16">

                            <div className="relative w-[100px] h-[100px] lg:w-[100px] lg:h-[100px]">

                                <Image src={walletImage} fill />

                            </div>

                        </div>
                        <div className="flex justify-center lg:justify-end">

                            <button type="button" className="relative group bg-black-background py-2  px-8 rounded-full flex items-center  gap-3 w-[100%] lg:w-[auto]" onClick={()  => connectWallet()}>
                                <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-8 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <p className="relative z-10 text-original-white  mb-1 w-[100%] lg:w-[auto]">Connect Wallet</p>

                            </button>

                        </div>

                    </div>

                    <div className="rounded-2xl p-6 lg:p-10 flex flex-col justify-between h-[350px] lg:h-[auto] bg-white-background stake-card">
                        <div>
                            <h1 className="text-[15px] lg:text-[20px] font-medium">Unstake</h1>
                            <p className="text-[11px] lg:text-para mt-6">Please connect a wallet to interact with this pool!</p>
                        </div>


                        <div className="flex justify-center items-center lg:mt-16 lg:mb-16">

                            <div className="relative w-[100px] h-[100px] lg:w-[100px] lg:h-[100px]">

                                <Image src={walletImage} fill />

                            </div>

                        </div>
                        <div className="flex justify-center lg:justify-end">

                            <button type="button" className="relative group bg-black-background py-2  px-8 rounded-full flex items-center  gap-3 w-[100%] lg:w-[auto]" onClick={() => connectWallet()}>
                                <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-8 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <p className="relative z-10 text-original-white  mb-1 w-[100%] lg:w-[auto]">Connect Wallet</p>

                            </button>

                        </div>

                    </div>
                </>)}


            </div>

        </>
    )
}

export default Stake