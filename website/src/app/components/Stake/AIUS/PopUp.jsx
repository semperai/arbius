import React from 'react'
import Image from "next/image"

function PopUp({ setShowPopUp ,children }) {
    return (
        <div className='fixed inset-0 flex justify-center items-center backdrop-blur-lg h-full overflow-y-hidden z-50 px-4 lg:px-0' onClick={() => setShowPopUp(false)}>
            <div className='rounded-xl pt-3 pb-6 px-6  bg-white-background w-[500px] stake-box-shadow' onClick={(e) => {
                e.stopPropagation()
            }}>

                {children}

            </div>

        </div>
    )
}

export default PopUp