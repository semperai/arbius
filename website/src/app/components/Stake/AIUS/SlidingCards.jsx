import React, { useRef, useState, useEffect } from 'react'
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import Image from "next/image"
import arrow_prev from "../../../assets/images/arrow_slider.png"
import PopUp from './PopUp';
import cross_icon from "../../../assets/images/cross_icon.png"
import arbius_logo_without_name from '@/app/assets/images/arbius_logo_without_name.png'
import ReactSlider from 'react-slider'
import info_icon from "../../../assets/images/info_icon.png"
import arbius_logo_slider from '@/app/assets/images/arbius_logo_slider.png'

const AddPopUpChildren = ({ setShowPopUp }) => {
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
                        <p className="pr- text-aius lato-bold text-[12px]">AIUS</p>
                    </div>
                    <div className="w-[94%]">
                        <input className="w-[100%] border-0 outline-none rounded-r-3xl p-1 px-2 lato-bold text-[15px] border-none focus:ring-0 " type="number" placeholder="0.0" />
                    </div>
                </div>
                <h1 className='text-[0.6rem] opacity-50 my-1'>Available AIUS 0.70</h1>
            </div>
            <div className='flex justify-center gap-2 items-center'>
                <div className='w-full bg-[#EEEAFF] p-3 py-6 rounded-2xl'>

                    <h1 className='text-xs'><span className='text-[20px] text-purple-text'>0.000</span>veAIUS</h1>
                    <h1 className='text-[.6rem]'>Est. veAIUS balance</h1>
                </div>
                <div className='w-full bg-[#EEEAFF] p-3 py-6 rounded-2xl'>

                    <h1 className='text-xs'><span className='text-[20px] text-purple-text'>0.000</span>%</h1>
                    <h1 className='text-[0.6rem]'>APR</h1>

                </div>

            </div>

            <div className='flex justify-end gap-2 mt-16'>
                <button
                    type="button"
                    className="relative group bg-[#F1F0F3] py-1 px-3 lg:px-5 rounded-full flex items-center gap-3 "
                    onClick={() => setShowPopUp(false)}
                >
                    <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-5 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="lato-bold  relative z-10 text-opacity-40 text-black-text group-hover:text-original-white lg:text-[100%]">
                        Cancel
                    </div>

                </button>
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

const ExtendPopUpChildren = ({ setShowPopUp }) => {
    const [sliderValue, setSliderValue] = useState(0)
    const [duration, setDuration] = useState({
        months: 0,
        weeks: 0
    })
    const [extendStartDate, setExtendStartDate] = useState(new Date("09/10/2024"))
    const [extendEndDate, setExtendEndDate] = useState(new Date("09/10/2024"))
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

                        if (value < 1) {
                            setDuration({ ...duration, months: 0, weeks: 4 * value })
                            
                        } else {
                            setDuration({ ...duration, months: value, weeks: 0 })
                            // setExtendEndDate(new Date(extendStartDate.getFullYear(), extendStartDate.getMonth() + value, extendStartDate.getDate()))
                        }
                        setExtendEndDate(new Date(extendStartDate.getFullYear(), extendStartDate.getMonth(), extendStartDate.getDate() + 30 * value))
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

                    <h1 className='text-xs text-purple-text font-semibold'>{extendStartDate.getMonth() + 1}/{extendStartDate.getDate()}/{extendStartDate.getFullYear()}</h1>
                    <h1 className='text-[.6rem]'>Current Stake ends at</h1>
                </div>
                <div className='w-full bg-[#EEEAFF] p-3 py-4 rounded-md'>

                    <h1 className='text-xs text-purple-text font-semibold'>{extendEndDate.getMonth() + 1}/{extendEndDate.getDate()}/{extendEndDate.getFullYear()}</h1>
                    <h1 className='text-[.6rem]'>Stake extended till</h1>
                </div>

            </div>

            <div className='border-2 rounded-xl  p-4 gap-3 flex justify-start items-center mt-4'>
                <Image src={info_icon} width={14} height={14} />
                <h1 className='text-[0.66rem]  text-purple-text'>An extension&apos;s duration cannot exceed a two year maximum</h1>
            </div>

            <div className='flex justify-end gap-2 mt-4'>
                <button
                    type="button"
                    className="relative group bg-[#F1F0F3] py-1 px-3 lg:px-5 rounded-full flex items-center gap-3 "
                    onClick={() => setShowPopUp(false)}
                >
                    <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-5 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="lato-bold  relative z-10 text-opacity-40 text-black-text group-hover:text-original-white lg:text-[100%]">
                        Cancel
                    </div>

                </button>
                <div className='flex justify-end'>

                    <button
                        type="button"
                        className="relative group bg-black-background py-1 px-3 lg:px-5 rounded-full flex items-center gap-3 "
                    >
                        <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-5 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="lato-bold  relative z-10 text-original-white lg:text-[100%]">
                            Extend
                        </div>

                    </button>


                </div>

            </div>
        </>
    )
}


const ClaimPopUpChildren = ({ setShowPopUp }) => {

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
            <div className='w-full bg-[#EEEAFF] text-center p-3 py-6 rounded-md'>

                <h1 className='text-xs '><span className='text-purple-text font-semibold text-[30px]'>0.046</span> AIUS</h1>
                <h1 className='text-[.6rem] mt-2'>Claimable AIUS</h1>
            </div>


        </div>

        <div className='border-2 rounded-xl  p-4 gap-3 flex justify-start items-center mt-4'>
            <Image src={info_icon} width={14} height={14} />
            <h1 className='text-[0.66rem]  text-purple-text'>AIUS is claimable directly to your wallet </h1>
        </div>

        <div className='flex justify-end gap-2 mt-12'>

            <button
                type="button"
                className="relative group bg-[#F1F0F3] py-1 px-3 lg:px-5 rounded-full flex items-center gap-3 "
                onClick={() => setShowPopUp(false)}
            >
                <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-5 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="lato-bold  relative z-10 text-opacity-40 text-black-text group-hover:text-original-white lg:text-[100%]">
                    Cancel
                </div>

            </button>

            <div className='flex justify-end'>

                <button
                    type="button"
                    className="relative group bg-black-background py-1 px-3 lg:px-5 rounded-full flex items-center gap-3 "
                >
                    <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-5 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
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


    var settings = {
        dots: false,
        infinite: false,
        speed: 500,
        slidesToShow: 2.5,
        slidesToScroll: 1,
        nextArrow: <NextBtn />,
        prevArrow: <PrevBtn />,
        responsive: [
        {
            breakpoint: 768,
            settings: {
              slidesToShow: 1.5,
              slidesToScroll: 1
            }
        },
        {
            breakpoint: 475,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1
            }
        },
        ]
    };

    function PrevBtn(props) {
        const { className, style, onClick } = props;
        if(className.includes("slick-disabled")){
            setDirection("right");
        }
        return (
            <div
                className={`absolute top-[40%]  left-[-22px] cursor-pointer rounded-full  z-20 bg-white-background p-3 w-[45px] h-[45px] border-2  flex justify-center items-center`}

                onClick={onClick}
            >
                <Image src={arrow_prev} className=' mr-[2px]' width={15} height={15} />

            </div>
        );
    }

    function NextBtn(props) {
        const { className, style, onClick } = props;
        if(className.includes("slick-disabled")){
            setDirection("left");
        }
        return (
            <div
                className={`absolute top-[40%] rounded-full  right-[-20px] cursor-pointer  bg-white-background p-3 w-[45px] h-[45px] border-2  flex justify-center items-center`}

                onClick={onClick}
            >
                <Image src={arrow_prev} className='rotate-180 ml-[2px]' width={15} height={15} />
            </div>
        );

    }


    useEffect(() => {
        console.log(direction, "direction")
        const elements = document.querySelectorAll('.slick-list');
        elements.forEach(element => {
            if(direction == "right"){
                element.style.boxShadow = '10px 0 5px -4px rgba(18, 0, 117, 0.077)';
            }else if(direction == "left"){
                element.style.boxShadow = '-10px 0 5px -4px rgba(18, 0, 117, 0.077)';
            }
        });
    }, [direction]);

    return (
        <div>
            {showPopUp !== false && (
                <PopUp setShowPopUp={setShowPopUp}>
                    {showPopUp === "add" && <AddPopUpChildren setShowPopUp={setShowPopUp} />}
                    {showPopUp === "claim" && <ClaimPopUpChildren setShowPopUp={setShowPopUp} />}
                    {showPopUp === "extend" && <ExtendPopUpChildren setShowPopUp={setShowPopUp} />}
                </PopUp>
            )}
            <div className='relative'>
                <div className='  pl-2  w-full flex justify-start  items-center  relative ' ref={sliderRef}>



                    <Slider {...settings}>
                        {data?.map((item, key) => (

                            <div className='rounded-2xl px-8 py-6  bg-white-background w-[40%] relative ' key={key}>

                                <Image src={arbius_logo_slider} className='absolute top-2 right-2 w-[36px] h-[36px] z-20' />
                                <div className='flex justify-start gap-8 items-center'>
                                    <div className='flex flex-col gap-3 justify-center items-start'>
                                        <div>
                                            <h2 className="text-[12px] text-[#8D8D8D] font-semibold">Total Staked</h2>
                                            <h2 className='text-[15px] font-semibold'>{item?.staked}</h2>

                                        </div>
                                        <div>
                                            <h2 className="text-[12px] text-[#8D8D8D] font-semibold">APR</h2>
                                            <h2 className='text-[15px] font-semibold'>{item?.apr}</h2>

                                        </div>

                                    </div>
                                    <div className='flex flex-col gap-3 justify-center items-start'>
                                        <div>
                                            <h2 className="text-[12px] text-[#8D8D8D] font-semibold">Governance Power</h2>
                                            <h2 className='text-[15px] font-semibold'>{item?.governance}</h2>

                                        </div>
                                        <div>
                                            <h2 className="text-[12px] text-[#8D8D8D] font-semibold">Staked on</h2>
                                            <h2 className='text-[15px] font-semibold'>{item?.stake_date}</h2>

                                        </div>
                                    </div>

                                </div>

                                <div className='flex justify-start gap-12 items-center mt-3'>
                                    <div>
                                        <h2 className="text-[12px] text-[#8D8D8D] font-semibold">End Date</h2>
                                        <h2 className='text-[15px] font-semibold'>{item?.end_date}</h2>

                                    </div>

                                </div>

                                <div className='flex justify-between gap-2 items-center mt-4'>

                                    <div className='w-[32%]'>
                                        <button
                                            type="button"
                                            onClick={() => setShowPopUp("add")}
                                            className="relative justify-center py-2 group bg-[#F3F3F3] py-1 px-3 lg:px-4 rounded-full flex items-center gap-3 w-full"
                                        >
                                            <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-4 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                            <div className="lato-bold  relative z-10  text-black-text group-hover:text-original-white opacity-40 group-hover:opacity-100 lg:text-[15px]">
                                                Add
                                            </div>

                                        </button>
                                    </div>
                                    <div className='w-[32%]'>
                                        <button
                                            type="button"
                                            onClick={() => setShowPopUp("extend")}
                                            className="relative justify-center py-2 group bg-[#F3F3F3] py-1 px-3 lg:px-4 rounded-full flex items-center gap-3 w-full"
                                        >
                                            <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-4 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                            <div className="lato-bold  relative z-10  text-black-text group-hover:text-original-white opacity-40 group-hover:opacity-100 lg:text-[15px]">
                                                Extend
                                            </div>

                                        </button>
                                    </div>
                                    <div className='w-[32%]'>
                                        <button
                                            type="button"
                                            onClick={() => setShowPopUp("claim")}
                                            className="relative justify-center py-2 group bg-black-background py-1 px-3 lg:px-4 rounded-full flex items-center gap-3 w-full"
                                        >
                                            <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-4 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                            <div className="lato-bold  relative z-10 text-original-white lg:text-[15px]">
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