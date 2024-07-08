import React, { useRef, useState } from 'react'

function Slider() {
    const sliderRef = useRef()
    const data = [{}, {}, {}, {}]
    const [scrollPosition, setScrollPosition] = useState(0)
    const handleLeftSwipe = () => {
        const doc = sliderRef.current;
        console.log({ doc });
        // doc.style.display = "none"
        doc.scrollLeft = scrollPosition + 400;
        setScrollPosition((init) => doc.scrollLeft)

    }

    const handleRightSwipe = () => {
        const doc = sliderRef.current;
        console.log({ doc });
        // doc.style.display = "none"
        doc.scrollLeft = scrollPosition - 400;
        setScrollPosition((init) => doc.scrollLeft)

    }

    return (
        <div className='relative'>
            {/* <button className='bg-white rounded-full p-2 absolute left-4 top-[50%]' onClick={()=> handleLeftSwipe()}>
                L

            </button>
            <button className='bg-white rounded-full p-2 absolute right-4 top-[50%]' onClick={()=> handleRightSwipe()}>
                R

            </button> */}
            <div className=' overflow-x-auto pl-6  w-full' ref={sliderRef}>


                <div className='flex justify-start gap-6 items-center my-3 w-full' >
                    {data?.map((item, key) => (
                        <>
                            <div className='rounded-2xl px-8 py-4  bg-white w-[40%]'>
                                <div className='flex justify-start gap-12 items-center mt-4'>
                                    <div>
                                        <h2 className="text-[10px] opacity-60">Balance</h2>
                                        <h2 className='text-[12px]'>641.12451 AIUS</h2>

                                    </div>
                                    <div>
                                        <h2 className="text-[10px] opacity-60">Balance</h2>
                                        <h2 className='text-[12px]'>641.12451 AIUS</h2>

                                    </div>
                                </div>
                                <div className='flex justify-start gap-12 items-center mt-4'>
                                    <div>
                                        <h2 className="text-[10px] opacity-60">Balance</h2>
                                        <h2 className='text-[12px]'>641.12451 AIUS</h2>

                                    </div>
                                    <div>
                                        <h2 className="text-[10px] opacity-60">Balance</h2>
                                        <h2 className='text-[12px]'>641.12451 AIUS</h2>

                                    </div>
                                </div>
                                <div className='flex justify-start gap-12 items-center mt-4'>
                                    <div>
                                        <h2 className="text-[10px] opacity-60">Balance</h2>
                                        <h2 className='text-[12px]'>641.12451 AIUS</h2>

                                    </div>

                                </div>

                                <div className='flex justify-between gap-2 items-center mt-4'>

                                    <div>
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
                                    <div>
                                        <button
                                            type="button"
                                            className="relative group bg-black-background bg-opacity-10 py-1 px-3 lg:px-5 rounded-full flex items-center gap-3 "
                                        >

                                            <div className="lato-bold  relative z-10 text-black opacity-40 lg:text-[100%]">
                                                Add
                                            </div>

                                        </button>
                                    </div>
                                    <div>
                                        <button
                                            type="button"
                                            className="relative group bg-black-background bg-opacity-10 py-1 px-3 lg:px-5 rounded-full flex items-center gap-3 "
                                        >

                                            <div className="lato-bold  relative z-10 text-black opacity-40 lg:text-[100%]">
                                                Add
                                            </div>

                                        </button>
                                    </div>

                                </div>

                            </div>
                        </>
                    ))}
                </div>



            </div>
        </div>
    )
}

export default Slider