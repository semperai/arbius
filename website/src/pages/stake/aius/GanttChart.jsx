import React from 'react'

function GanttChart() {
    const data = [
        {
            start: 5,
            blue: 6,
            gray: 2
        },
        {
            start: 9,
            blue: 8,
            gray: 4
        },
        {
            start: 2,
            blue: 8,
            gray: 4
        }
    ]
    return (
        <div className='rounded-2xl p-8 bg-white stake-box-shadow relative'>
            <h1 className='text-[#4A28FF] text-[20px] font-semibold'>Staking</h1>
            {/* <div className='flex justify-between items-center mt-6 mb-10'>
                            <div>
                                <h2 className="text-[14px] opacity-30">Balance</h2>
                                <h2 className='text-[16px]'>641.12451 AIUS</h2>

                            </div>
                            <div>
                                <h2 className="text-[14px] opacity-30">Balance</h2>
                                <h2 className='text-[16px]'>641.12451 AIUS</h2>

                            </div>
                            <div>
                                <h2 className="text-[14px] opacity-30">Balance</h2>
                                <h2 className='text-[16px]'>641.12451 AIUS</h2>

                            </div>


                        </div> */}

            {
                data?.map((item, key) => {
                    return <div className=' my-4'>

                        
                        <div className='item-grid' key={key}>
                            <div className={`  col-span-2 bg-transparent h-[.4rem] my-3 rounded-full `} style={{
                                gridColumn: `span ${item?.start} / span ${item?.start}`
                            }}>
                               
                            </div>  
                            <div className={` bg-[#4A28FF] h-[.4rem] my-3 rounded-full relative`} style={{
                                gridColumn: `span ${item?.blue} / span ${item?.blue}`
                            }}>
                                 <h1 className='absolute left-0 bottom-[8px] text-[.7rem] opacity-30'>Locked Until</h1>
                                 <h1 className='absolute left-0 top-[8px] text-[.7rem] opacity-30 text-[#4A28FF]'>7.021 AIUS Staked</h1>
                            </div>
                            <div className={` bg-gray-300  h-[.4rem] my-3 rounded-r-full relative`} style={{
                                gridColumn: `span ${item?.gray} / span ${item?.gray}`
                            }}>
                                <h1 className='absolute right-0 bottom-[8px] text-[.8rem] text-[#4A28FF] min-w-[90px]'>14.12 veAIUS</h1>
                            </div>

                        </div>
                    </div>
                })

                
            }
            <div className='item-grid absolute bottom-[.0rem] right-0 left-0 px-8'>

                {
                   Array(24).fill(null).map((item,key)=>{
                        return <div className={key==23 ? 'w-full border-x-[1px] border-[#4828ff4f] pt-2':'w-full border-l-[1px] border-[#4828ff4f] pt-2'}>
                            <div className='w-full bg-[#EDEDED] h-[.35rem]'>

                            </div>

                        </div>
                    })
                }

            </div>
        </div>
    )
}

export default GanttChart   