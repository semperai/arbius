import React from 'react'
import gysr_logo from "../../../assets/images/gysr_logo_without_name.png"
import wallet_icon from "../../../assets/images/ion_wallet-outline.png"
import up_icon from "../../../assets/images/amount_up.png"
import sort_icon from "../../../assets/images/sort.png"
import gift_icon from "../../../assets/images/gift.png"
import time_icon from "../../../assets/images/time.png"
import arrow_icon from "../../../assets/images/rounded_arrow.png"
import Image from 'next/image'
function ActivityTable() {
    return (
        <div>
            <div class="flex flex-col bg-white-background table-gysr px-6 py-4">
                <div class=" overflow-x-auto">
                    <div class="p-1.5 min-w-full inline-block align-middle">
                        <div class="overflow-hidden">
                            <table class="min-w-full ">
                                <thead>
                                    <tr>
                                        <th scope="col" class="px-6 py-3 text-start text-[12px] lg:text-[15px] font-medium text-gray-500 ">
                                            <div className='flex flex-col items-start ml-[12%] justify-center'><Image width={15} height={15} src={sort_icon} /></div>

                                            <h1>Action</h1>
                                        </th>
                                        <th scope="col" class="px-6 py-3 text-start text-[12px] lg:text-[15px] font-medium text-gray-500 ">
                                            <div className='flex flex-col items-start ml-[12%] justify-center'><Image width={15} height={15} src={up_icon} /></div>

                                            <h1>Amount</h1>
                                        </th>
                                        <th scope="col" class="px-6 py-3 text-start text-[12px] lg:text-[15px] font-medium text-gray-500 ">
                                            <div className='flex flex-col items-start ml-[12%] justify-center'><Image width={15} height={15} src={gift_icon} /></div>

                                            <h1>Earnings</h1>
                                        </th>
                                        <th scope="col" class="px-6 py-3 text-start text-[12px] lg:text-[15px] font-medium text-gray-500">
                                            <div className='flex flex-col items-start ml-[12%] justify-center'><Image width={15} height={15} src={gysr_logo} className='table-icon' /></div>

                                            <h1>GYSR Spent</h1>
                                        </th>
                                        <th scope="col" class="px-6 py-3 text-start text-[12px] lg:text-[15px] font-medium text-gray-500 ">
                                            <div className='flex flex-col items-start ml-[12%] justify-center'><Image width={15} height={15} src={wallet_icon} className='table-icon' /></div>

                                            <h1>Account</h1>
                                        </th>
                                        <th scope="col" class="px-6 py-3 text-start text-[12px] lg:text-[15px] font-medium text-gray-500 ">
                                            <div className='flex flex-col items-start ml-[8%] justify-center'><Image width={15} height={15} src={time_icon} /></div>

                                            <h1>Time</h1>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody class="">
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-[12px] lg:text-[15px] font-medium text-gray-800">Claim</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-[12px] lg:text-[15px] text-gray-800">35 UNI-V2</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-[12px] lg:text-[15px] text-gray-800">55.9 AIUS</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-[12px] lg:text-[15px] text-gray-800">600 GYSR</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-[12px] lg:text-[15px] text-gray-800">xamn....js</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-[12px] lg:text-[15px] text-gray-800">13 Hrs ago</td>
                                    </tr>
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-[12px] lg:text-[15px] font-medium text-gray-800">Claim</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-[12px] lg:text-[15px] text-gray-800">35 UNI-V2</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-[12px] lg:text-[15px] text-gray-800">55.9 AIUS</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-[12px] lg:text-[15px] text-gray-800">600 GYSR</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-[12px] lg:text-[15px] text-gray-800">xamn....js</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-[12px] lg:text-[15px] text-gray-800">13 Hrs ago</td>
                                    </tr>
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-[12px] lg:text-[15px] font-medium text-gray-800">Claim</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-[12px] lg:text-[15px] text-gray-800">35 UNI-V2</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-[12px] lg:text-[15px] text-gray-800">55.9 AIUS</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-[12px] lg:text-[15px] text-gray-800">600 GYSR</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-[12px] lg:text-[15px] text-gray-800">xamn....js</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-[12px] lg:text-[15px] text-gray-800">13 Hrs ago</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>



            <div className='flex justify-end mt-6'>
                <div className='bg-white-background flex gap-4 justify-center items-center p-3 rounded-md'>
                    <button className='p-1 rotate-180'>

                        <Image src={arrow_icon} width={20} height={20} />

                    </button>

                    <button className='p-1'>1</button>
                    <button className='p-1'>2</button>
                    <button className='p-1'>3</button>
                    <button className='p-1'>4</button>
                    <button className='p-1'>5</button>
                    <button className='p-1'>6</button>
                    <button className='p-1'>7</button>


                    <button className='p-1'>

                        <Image src={arrow_icon} width={20} height={20} />

                    </button>
                </div>

            </div>
        </div>
    )
}

export default ActivityTable