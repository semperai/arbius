import React, { useRef, useState } from 'react'
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import Image from "next/image"
import arrow_prev from "../../../app/assets/images/arrow_slider.png"
function PrevBtn(props) {
    const { className, style, onClick } = props;
    return (
        <div
            className={`absolute top-[40%]  left-[-10px] cursor-pointer rounded-full  z-20 bg-white p-3 w-[45px] h-[45px] border-2  flex justify-center items-center`}

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
            className={`absolute top-[40%] rounded-full  right-[-8px] cursor-pointer  bg-white p-3 w-[45px] h-[45px] border-2  flex justify-center items-center`}

            onClick={onClick}
        >
            <Image src={arrow_prev} className='rotate-180 ' width={15} height={15} />
        </div>
    );

}


function SlidingCards() {
    const sliderRef = useRef()
    const data = [{}, {}, {}, {}]
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
        <div className='relative'>
            {/* <button className='bg-white rounded-full p-2 absolute left-4 top-[50%]' onClick={()=> handleLeftSwipe()}>
                L

            </button>
            <button className='bg-white rounded-full p-2 absolute right-4 top-[50%]' onClick={()=> handleRightSwipe()}>
                R

            </button> */}
            <div className='  pl-6  w-full flex justify-start  items-center my-3 relative' ref={sliderRef}>



                <Slider {...settings}>
                    {data?.map((item, key) => (

                        <div className='rounded-2xl px-8 py-4  bg-white w-[40%]' key={key}>
                            <div className='flex justify-start gap-12 items-center mt-4'>
                                <div>
                                    <h2 className="text-[10px] opacity-30 font-semibold">Balance</h2>
                                    <h2 className='text-[11px] font-semibold'>641.12451 AIUS</h2>

                                </div>
                                <div>
                                    <h2 className="text-[10px] opacity-30 font-semibold">Balance</h2>
                                    <h2 className='text-[11px] font-semibold'>641.12451 AIUS</h2>

                                </div>
                            </div>
                            <div className='flex justify-start gap-12 items-center mt-4'>
                                <div>
                                    <h2 className="text-[10px] opacity-30 font-semibold">Balance</h2>
                                    <h2 className='text-[11px] font-semibold'>641.12451 AIUS</h2>

                                </div>
                                <div>
                                    <h2 className="text-[10px] opacity-30 font-semibold">Balance</h2>
                                    <h2 className='text-[11px] font-semibold'>641.12451 AIUS</h2>

                                </div>
                            </div>
                            <div className='flex justify-start gap-12 items-center mt-4'>
                                <div>
                                    <h2 className="text-[10px] opacity-30 font-semibold">Balance</h2>
                                    <h2 className='text-[11px] font-semibold'>641.12451 AIUS</h2>

                                </div>

                            </div>

                            <div className='flex justify-between gap-2 items-center mt-4'>

                                <div>
                                    <button
                                        type="button"
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
    )
}

export default SlidingCards