import React, { useRef, useState } from 'react'
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import Image from "next/image"
import arrow_prev from "../../../app/assets/images/arrow_slider.png"
import PopUp from './PopUp';
import cross_icon from "../../../app/assets/images/cross_icon.png"
import arbius_logo_without_name from '@/app/assets/images/arbius_logo_without_name.png'
import ReactSlider from 'react-slider'
import info_icon from "../../../app/assets/images/info_icon.png"
function PrevBtn(props) {
    const { className, style, onClick } = props;
    return (
        <div
            className={`absolute top-[40%]  left-[-10px] cursor-pointer rounded-full  z-20 bg-white-background p-3 w-[45px] h-[45px] border-2  flex justify-center items-center`}

            onClick={onClick}
        >
            <Image src={arrow_prev} className=' ' width={15} height={15} />

        </div>
    );
}

function NextBtn(props) {
    const { className, style, onClick } = props;
    return (
        <div
            className={`absolute top-[40%] rounded-full  right-[-8px] cursor-pointer  bg-white-background p-3 w-[45px] h-[45px] border-2  flex justify-center items-center`}

            onClick={onClick}
        >
            <Image src={arrow_prev} className='rotate-180 ' width={15} height={15} />
        </div>
    );

}

const AddPopUpChildren = () => {
    return (
        <>
            <div className='flex justify-between items-center my-2'>
                <div className='flex justify-start items-center gap-3'>

                    <h1>Add AIUS</h1>
                </div>
                <div className='cursor-pointer' onClick={() => setShowPopUp(false)}>
                    <Image src={cross_icon} className='w-[10px] h-[10px]' />
                </div>

            </div>

            <div className='my-4'>
                <div className="border border-[#2F2F2F] rounded-3xl flex items-center">
                    <div className="bg-stake-input flex items-center gap-2 justify-center rounded-l-3xl  p-1 px-2 box-border">
                        <div className="bg-white-background w-[30px] h-[30px] rounded-[50%] flex items-center justify-center ">
                            <Image src={arbius_logo_without_name} width={15} alt="arbius" />
                        </div>
                        <p className="pr- text-aius lato-bold text-[12px]">veAIUS</p>
                    </div>
                    <div className="w-[94%]">
                        <input className="w-[100%] border-0 outline-none rounded-r-3xl p-1 px-2 lato-bold text-[15px]" type="number" placeholder="0.0" />
                    </div>
                </div>
                <h1 className='text-[0.6rem] opacity-50 my-1'>Available AIUS 00.70</h1>
            </div>
            <div className='flex justify-center gap-2 items-center'>
                <div className='w-full bg-[#EEEAFF] p-3 py-6 rounded-2xl'>

                    <h1 className='text-xs'><span className='text-[20px] text-purple-text'>0.000</span>veAIUS</h1>
                    <h1 className='text-[.6rem]'>Est. veAIUS rewards</h1>
                </div>
                <div className='w-full bg-[#EEEAFF] p-3 py-6 rounded-2xl'>

                    <h1 className='text-xs'><span className='text-[20px] text-purple-text'>0.000</span>%</h1>
                    <h1 className='text-[0.6rem]'>APR</h1>

                </div>

            </div>

            <div className='flex justify-end gap-2 mt-16'>
                <button className='rounded-full bg-[#F1F0F3] text-[#AFAFB0] p-1 text-sm px-6' >Cancel</button>
                <div className='flex justify-end'>

                    <button
                        type="button"
                        className="relative group bg-black-background py-1 px-3 lg:px-5 rounded-full flex items-center gap-3 "
                    >
                        <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-5 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="lato-bold  relative z-10 text-original-white lg:text-[100%]">
                            Add
                        </div>

                    </button>


                </div>

            </div>
        </>
    )
}

const ExtendPopUpChildren = () => {
    const [sliderValue, setSliderValue] = useState(0)
    const [duration, setDuration] = useState({
        months: 0,
        weeks: 0
    })
    return (

        <>
            <div className='flex justify-between items-center my-2'>
                <div className='flex justify-start items-center gap-3'>

                    <h1>Extend</h1>
                </div>
                <div className='cursor-pointer' onClick={() => setShowPopUp(false)}>
                    <Image src={cross_icon} className='w-[10px] h-[10px]' />
                </div>

            </div>

            <div className='my-6'>

                <ReactSlider
                    className=" text-original-white border-b border-4 border-[#ECECEC] rounded-2xl"
                    thumbClassName=" w-[28px] h-[28px] ml-[-5px] bg-thumb cursor-pointer rounded-[50%] flex items-center justify-center border-0 mt-[-14px] outline-none"
                    markClassName="customSlider-mark"
                    marks={4}
                    min={0}
                    step={.25}
                    max={24}
                    defaultValue={0}
                    value={sliderValue}
                    onChange={(value) => {
                        console.log(value);
                        if (value < 1) {
                            setDuration({ ...duration, months: 0, weeks: 4 * value })
                        } else {
                            setDuration({ ...duration, months: value, weeks: 0 })
                        }
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

                    <h1 className='text-xs text-purple-text font-semibold'>09/10/2024</h1>
                    <h1 className='text-[.6rem]'>Current Stake ends at</h1>
                </div>
                <div className='w-full bg-[#EEEAFF] p-3 py-4 rounded-md'>

                    <h1 className='text-xs text-purple-text font-semibold'>09/10/2025</h1>
                    <h1 className='text-[.6rem]'>Stake extended till</h1>
                </div>

            </div>

            <div className='border-2 rounded-xl  p-4 gap-3 flex justify-start items-center mt-4'>
                    <Image src={info_icon}/>
                    <h1 className='text-[0.6rem] text-purple-text'>Extend allows you to only increase the duration of your stake by max 2 years</h1>
            </div>

            <div className='flex justify-end gap-2 mt-4'>
                <button className='rounded-full bg-[#F1F0F3] text-[#AFAFB0] p-1 text-sm px-6' >Cancel</button>
                <div className='flex justify-end'>

                    <button
                        type="button"
                        className="relative group bg-black-background py-1 px-3 lg:px-5 rounded-full flex items-center gap-3 "
                    >
                        <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-5 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="lato-bold  relative z-10 text-original-white lg:text-[100%]">
                            Add
                        </div>

                    </button>


                </div>

            </div>
        </>
    )
}


const ClaimPopUpChildren = () =>{

    return <>
            <div className='flex justify-between items-center my-2'>
                <div className='flex justify-start items-center gap-3'>

                    <h1>Claim</h1>
                </div>
                <div className='cursor-pointer' onClick={() => setShowPopUp(false)}>
                    <Image src={cross_icon} className='w-[10px] h-[10px]' />
                </div>

            </div>

           
            <div className='flex justify-center gap-2 items-center mt-6'>
                <div className='w-full bg-[#EEEAFF] text-center p-3 py-8 rounded-md'>

                    <h1 className='text-xs '><span className='text-purple-text font-semibold text-[30px]'>0.046</span> AIUS</h1>
                    <h1 className='text-[.6rem]'>Claimable AIUS</h1>
                </div>
                

            </div>

            <div className='border-2 rounded-xl  p-4 gap-3 flex justify-start items-center mt-4'>
                    <Image src={info_icon}/>
                    <h1 className='text-[0.6rem] text-purple-text'>Extend allows you to only increase the duration of your stake by max 2 years</h1>
            </div>

            <div className='flex justify-end gap-2 mt-12'>
                <button className='rounded-full bg-[#F1F0F3] text-[#AFAFB0] p-1 text-sm px-6' >Cancel</button>
                <div className='flex justify-end'>

                    <button
                        type="button"
                        className="relative group bg-black-background py-1 px-3 lg:px-5 rounded-full flex items-center gap-3 "
                    >
                        <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-5 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="lato-bold  relative z-10 text-original-white lg:text-[100%]">
                            Add
                        </div>

                    </button>


                </div>

            </div>
        </>

}


function SlidingCards() {
    const [showPopUp, setShowPopUp] = useState(false)
    const sliderRef = useRef()
    const data = [{
        staked: "2,441.21 AIUS",
        apr: "14.1211%",
        governance: "12.12",
        stake_date: "06/14/2024",
        end_date: "06/14/2024"
    },
    {

        staked: "2,441.21 AIUS",
        apr: "14.1211%",
        governance: "12.12",
        stake_date: "06/14/2024",
        end_date: "06/14/2024"
    },
    {

        staked: "2,441.21 AIUS",
        apr: "14.1211%",
        governance: "12.12",
        stake_date: "06/14/2024",
        end_date: "06/14/2024"
    }
    ]
    // const [scrollPosition, setScrollPosition] = useState(0)
    // const handleLeftSwipe = () => {
    //     const doc = sliderRef.current;
    //     console.log({ doc });
    //     // doc.style.display = "none"
    //     doc.scrollLeft = scrollPosition + 400;
    //     setScrollPosition((init) => doc.scrollLeft)

    // }

    // const handleRightSwipe = () => {
    //     const doc = sliderRef.current;
    //     console.log({ doc });
    //     // doc.style.display = "none"
    //     doc.scrollLeft = scrollPosition - 400;
    //     setScrollPosition((init) => doc.scrollLeft)

    // }

    var settings = {
        dots: false,
        infinite: false,
        speed: 500,
        slidesToShow: 5 / 2,
        slidesToScroll: 1,
        nextArrow: <NextBtn />,
        prevArrow: <PrevBtn />
    };

    return (
        <div>
            {showPopUp !== false && (
                <PopUp setShowPopUp={setShowPopUp}>
                    {showPopUp === "add" && <AddPopUpChildren />}
                    {showPopUp === "claim" && <ClaimPopUpChildren />}
                    {showPopUp === "extend" && <ExtendPopUpChildren />}
                </PopUp>
            )}
            <div className='relative'>
                <div className='  pl-6  w-full flex justify-start  items-center my-3 relative' ref={sliderRef}>



                    <Slider {...settings}>
                        {data?.map((item, key) => (

                            <div className='rounded-2xl px-8 py-6  bg-white-background w-[40%] ' key={key}>
                                <div className='flex justify-start gap-12 items-center'>
                                    <div className='flex flex-col gap-3 justify-center items-start'>
                                        <div>
                                            <h2 className="text-[10px] opacity-30 font-semibold">Total Staked</h2>
                                            <h2 className='text-[11px] font-semibold'>{item?.staked}</h2>

                                        </div>
                                        <div>
                                            <h2 className="text-[10px] opacity-30 font-semibold">APR</h2>
                                            <h2 className='text-[11px] font-semibold'>{item?.apr}</h2>

                                        </div>

                                    </div>
                                    <div className='flex flex-col gap-3 justify-center items-start'>
                                        <div>
                                            <h2 className="text-[10px] opacity-30 font-semibold">Governance Power</h2>
                                            <h2 className='text-[11px] font-semibold'>{item?.governance}</h2>

                                        </div>
                                        <div>
                                            <h2 className="text-[10px] opacity-30 font-semibold">Staked on</h2>
                                            <h2 className='text-[11px] font-semibold'>{item?.stake_date}</h2>

                                        </div>
                                    </div>

                                </div>

                                <div className='flex justify-start gap-12 items-center mt-3'>
                                    <div>
                                        <h2 className="text-[10px] opacity-30 font-semibold">End Date</h2>
                                        <h2 className='text-[11px] font-semibold'>{item?.end_date}</h2>

                                    </div>

                                </div>

                                <div className='flex justify-between gap-2 items-center mt-4'>

                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => setShowPopUp("add")}
                                            className="relative group bg-black-background py-1 px-3 lg:px-4 rounded-full flex items-center gap-3 "
                                        >
                                            <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-4 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                            <div className="lato-bold  relative z-10 text-original-white lg:text-[12px]">
                                                Add
                                            </div>

                                        </button>
                                    </div>
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => setShowPopUp("extend")}
                                            className="relative group bg-black-background bg-opacity-10 py-1 px-3 lg:px-4 rounded-full flex items-center gap-3 "
                                        >

                                            <div className="lato-bold  relative z-10 text-black opacity-40 lg:text-[12px]">
                                                Extend
                                            </div>

                                        </button>
                                    </div>
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => setShowPopUp("claim")}
                                            className="relative group bg-black-background bg-opacity-10 py-1 px-3 lg:px-4 rounded-full flex items-center gap-3 "
                                        >

                                            <div className="lato-bold  relative z-10 text-black opacity-40 lg:text-[12px]">
                                                Claim
                                            </div>

                                        </button>
                                    </div>

                                </div>

                            </div>

                        ))}
                    </Slider>




                </div>
            </div>

        </div>
    )
}

export default SlidingCards