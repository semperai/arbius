import React from 'react'
import { useEffect } from 'react';
import Image from 'next/image';
import gysr from "@/app/assets/images/gysr_logo_without_name.png";
import unilogo from "@/app/assets/images/unilogo.png"
import arbiuslogorounded from "@/app/assets/images/arbiuslogo_rounded.png"
import gysrlogorounded from "@/app/assets/images/gysrlogo_rounded.png"
import GradientCrad from "@/app/components/Stake/GYSR/GradientCrad";
import Link from "next/link"
function TopHeaderSection({ data }) {

    const headerCardData = [

        {
            heading: data ? parseFloat(data?.pool?.staked).toFixed(2) : "",
            subheading: "UNI-V2",
            para: "Staked",
            logo: unilogo
        },
        {
            heading: `${parseFloat(parseFloat((data?.pool?.funded - data?.pool.distributed).toFixed(2)) / 1000).toFixed(2)}k`,
            subheading: "AIUS",
            para: "Remaining",
            logo: arbiuslogorounded
        },
        {
            heading: `${data ? parseFloat(data?.pool?.apr).toFixed(2) : ""}%`,
            subheading: "",
            para: "APR",
            logo: gysrlogorounded,
        }

    ]
    return (
        <>

            <div className="w-mobile-section-width lg:w-section-width m-[auto] py-24 max-w-center-width">
                <div>
                    <div className="flex justify-start items-center">

                        <div className="relative w-[30px] lg:w-[40px] h-[auto]">
                            <Image src={gysr} />
                        </div>

                        <div className="flex justify-start items-baseline pl-2">
                            <h1 className="lg:text-header 2xl:text-header-2xl text-mobile-header font-medium text-black-text">
                                GYSR
                            </h1>
                            {/* <h2 className="lg:text-[25px] 2xl:text-[45px] text-[20px] font-medium text-black-text pl-1">
                                Stake
                            </h2> */}

                        </div>

                    </div>
                    <p className="text-para text-subtext-three  text-subtext-two mt-6">
                        Stake AIUS and ETH, earn AIUS rewards.
                    </p>


                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                        {headerCardData.map((item, key) => {
                            return (
                                <GradientCrad data={data} key={key} heading={item?.heading} subheading={item?.subheading} para={item?.para} logo={item?.logo} />
                            )
                        })}

                    </div>

                    <Link href="https://app.uniswap.org/add/v2/0x8afe4055ebc86bd2afb3940c0095c9aca511d852/ETH?chain=mainnet" target="_blank">
                        <p className="text-para text-subtext-three font-medium  text-subtext-two mt-6 hover:underline decoration-[#4A28FF] hover:text-[#4A28FF]">
                            Get UNI-V2 by providing liquidity on Uniswap ➚
                        </p>
                    </Link>

                </div>

            </div>
        </>
    )
}

export default TopHeaderSection