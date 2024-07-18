import React from 'react'
import { useEffect,useState } from 'react'
import gysr_logo from "../../../assets/images/gysr_logo_without_name.png"
import wallet_icon from "../../../assets/images/ion_wallet-outline.png"
import up_icon from "../../../assets/images/amount_up.png"
import sort_icon from "../../../assets/images/sort.png"
import gift_icon from "../../../assets/images/gift.png"
import time_icon from "../../../assets/images/time.png"
import arrow_icon from "../../../assets/images/rounded_arrow.png"
import Image from 'next/image'
import { getTransactions } from '../../../Utils/getActivities'
import Loader from '../../Loader/loader'



function ActivityTable() {
    const [data, setData] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const fetchedData = await getTransactions();
                 console.log(fetchedData,"transactions")
                setData(fetchedData);
            } catch (error) {
                console.error('Error fetching data:', error);
                // Handle error as needed
            }
        };

        fetchData(); // Call fetchData function on component mount (similar to componentDidMount)
    }, [currentPage]);

    const handleClickNext = () => {
        if (currentPage < Math.ceil(data.length / itemsPerPage)) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handleClickPrev = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleClickTab = (pageNum) => {
        setCurrentPage(pageNum);
    };
    const paginatedData = data?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    function timeSince(timestamp) {
        const now = Date.now(); // Current time in milliseconds since epoch
        timestamp = Number(timestamp);

    // Check if the timestamp is in milliseconds or seconds and convert if necessary
        if (timestamp.toString().length === 10) {
            timestamp *= 1000; // Convert seconds to milliseconds
        }

        const diffMs = now - timestamp; // Difference in milliseconds between now and the timestamp
    
        // Calculate time differences in days, hours, and minutes
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
        // Construct the time ago string based on the largest time unit that is nonzero
        if (diffDays > 0) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else {
            return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        }
    }
    function hexToDecimal(hexString) {
        // alert(hexString)
        // Remove the '0x' prefix if present
        if(hexString=="0x" ||hexString==null  ){
            return '-'
        }
        hexString = hexString?.startsWith('0x') ? hexString.slice(2) : hexString;
        
        // Convert hexadecimal to decimal using BigInt
        const decimalValue = BigInt('0x' + hexString).toString();
    
        return formatNumber(decimalValue)
    }
    function formatNumber(number) {
        const symbols = ['', 'k', 'M', 'B', 'T']; // Add more as needed for larger numbers
        const tier = Math.floor(Math.log10(number) / 3);
    
        if (tier === 0) return number.toString(); // Less than 1000, no abbreviation needed
    
        const suffix = symbols[tier];
        const scale = Math.pow(10, tier * 3);
    
        const scaledNumber = number / scale;
        const formattedNumber = scaledNumber.toFixed(1); // Adjust decimals as needed
    
        return formattedNumber ;
    }
    function cropAddress(address) {
        var start = window.innerWidth > '786' ? address.substring(0, 6) : address.substring(0, 2); // Change the numbers to adjust the length of the beginning part you want to keep
        var end = address.substring(address.length - 4, address.length); // Change the numbers to adjust the length of the end part you want to keep
        return start + "..." + end;
    }
 // Output: e.g., "2 days ago", "1 hour ago", "5 minutes ago", etc.
    
    
    return (
        <div className=''>
            <div class="flex flex-col bg-white-background table-gysr px-6 py-4 text-[#101010]">
                <div class=" overflow-x-auto ">
                    <div class="p-1.5 min-w-full inline-block align-middle">
                        <div class="overflow-hidden">
                        {
                            data ?
                            <table class="min-w-full ">
                                <thead>
                                    <tr>
                                        <th scope="col" class="px-6 py-3 text-center text-[12px] lg:text-[15px] font-medium text-gray-500 ">
                                            <div className=' flex justify-center'><Image width={15} height={15} src={sort_icon} /></div>

                                            <h1>Action</h1>
                                        </th>
                                        <th scope="col" class="px-6 py-3 text-center text-[12px] lg:text-[15px] font-medium text-gray-500 ">
                                            <div className=' flex justify-center'><Image width={15} height={15} src={up_icon} /></div>

                                            <h1>Amount</h1>
                                        </th>
                                        <th scope="col" class="px-6 py-3 text-center text-[12px] lg:text-[15px] font-medium text-gray-500 ">
                                            <div className=' flex justify-center'><Image width={15} height={15} src={gift_icon} /></div>

                                            <h1>Earnings</h1>
                                        </th>
                                        <th scope="col" class="px-6 py-3 text-center text-[12px] lg:text-[15px] font-medium text-gray-500">
                                            <div className=' flex justify-center'><Image width={15} height={15} src={gysr_logo} className='table-icon' /></div>

                                            <h1>GYSR Spent</h1>
                                        </th>
                                        <th scope="col" class="px-6 py-3 text-center text-[12px] lg:text-[15px] font-medium text-gray-500 ">
                                            <div className='flex justify-center'><Image width={15} height={15} src={wallet_icon} className='table-icon' /></div>

                                            <h1>Account</h1>
                                        </th>
                                        <th scope="col" class="px-6 py-3 text-center text-[12px] lg:text-[15px] font-medium text-gray-500 ">
                                            <div className=' flex justify-center'><Image width={15} height={15} src={time_icon} /></div>

                                            <h1>Time</h1>
                                        </th>
                                    </tr>
                                </thead>
                                 <tbody className="text-[#101010]">
                                   {data ? paginatedData?.map((item, key) => {
                                       return <>
                                           <tr key={key} className='text-[#101010]'>
                                               <td class="px-6 py-4 whitespace-nowrap text-[#101010] text-center text-[12px] lg:text-[15px] font-medium ">{item?.functionName}</td>
                                               <td class="px-6 py-4 whitespace-nowrap text-[#101010] text-center text-[12px] lg:text-[15px] ">{parseFloat(item?.amount).toFixed(2)} UNI-V2</td>
                                               <td class="px-6 py-4 whitespace-nowrap text-[#101010] text-center text-[12px] lg:text-[15px] ">{item?.gysr_spent} </td>
                                               <td class="px-6 py-4 whitespace-nowrap text-[#101010] text-center text-[12px] lg:text-[15px] ">{hexToDecimal(item?.decodedParams.rewarddata) =='-'?"-": `${hexToDecimal(item?.decodedParams.rewarddata)} GYSR`}</td>
                                               <a target="_blank" href={`https://etherscan.io/tx/${item.blockHash}`}>
                                               <td class="px-6 py-4 whitespace-nowrap text-[#101010] text-center text-[12px] lg:text-[15px] ">{cropAddress(item?.from)}</td>
                                               </a>
                                               
                                               <td class="px-6 py-4 whitespace-nowrap text-[#101010] text-center text-[12px] lg:text-[15px] ">{timeSince(item?.timestamp)}</td>
                                           </tr> 

                                       </>
                                   }):null}


                               </tbody>:<thread className='w-[100%] flex justify-center items-center'>
                               
                               </thread>
                                
                                
                            </table>:
                            <div className='w-[100%] flex justify-center'>
                            <Loader/>
                            </div>
                            }
                        </div>
                    </div>
                </div>
            </div>



            <div className='flex justify-end mt-6 text-[#101010]'>
                <div className='bg-white-background flex gap-4 justify-center items-center p-3 rounded-md'>
                    <button className='p-1 rotate-180 'onClick={()=>handleClickPrev()}>

                        <Image src={arrow_icon} width={20} height={20} />

                    </button>

                    <button className={`p-1 ${currentPage ===1 && 'text-purple-text font-bold'}`} onClick={()=>handleClickTab(1)}>1</button>
                    <button className={`p-1 ${currentPage ===2 && 'text-purple-text font-bold'}`} onClick={()=>handleClickTab(2)}>2</button>
                    <button className={`p-1 ${currentPage ===3 && 'text-purple-text font-bold'}`} onClick={()=>handleClickTab(3)}>3</button>
                    <button className={`p-1 ${currentPage ===4 && 'text-purple-text font-bold'}`} onClick={()=>handleClickTab(4)}>4</button>
                    <button className={`p-1 ${currentPage ===5 && 'text-purple-text font-bold'}`} onClick={()=>handleClickTab(5)}>5</button>
                    <button className={`p-1 ${currentPage ===6 && 'text-purple-text font-bold'}`} onClick={()=>handleClickTab(6)}>6</button>
                    <button className={`p-1 ${currentPage ===7 && 'text-purple-text font-bold'}`} onClick={()=>handleClickTab(7)}>7</button>


                    <button className='p-1' onClick={()=>handleClickNext()}>

                        <Image src={arrow_icon} width={20} height={20} />

                    </button>
                </div>

            </div>
        </div>
    )
}

export default ActivityTable