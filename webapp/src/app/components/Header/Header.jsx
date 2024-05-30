import React from "react";
import ArbiusLogo from "../../assets/images/arbius_logo.png";
import external_link from "../../assets/images/external_link.png";
import arbius from "../../assets/images/arbius_logo_without_name.png";
import gysr from "../../assets/images/gysr_logo_without_name.png";
import kandinsky from "../../assets/images/kandinsky.png";
import Image from 'next/image';

export default function Header(){
    return (
        <div className="bg-[white]">
            <div className="flex justify-between h-[80px] w-[90%] m-auto">
                <div className="flex items-center">
                    <Image className="h-[40px] w-[auto]" src={ArbiusLogo} alt="Arbius Logo" />
                </div>
                <div className="flex items-center">
                    <div className="flex justify-between items-center gap-[30px] link-block text-[14px] text-[gray]">
                        <div>Generate</div>
                        <div className="link-with-image relative group">
                            <div className="link">Staking<Image className="ext-link" src={external_link} alt="" /></div>
                            <div className="p-[15px_30px] bg-[black] absolute opacity-0"></div>
                            <div className="staking translate-x-[-30%] translate-y-[30px] hidden group-hover:flex">
                                <div className="staking-block">
                                    <Image className="h-[20px] w-[auto]" src={gysr} alt="" />
                                    <div>GYSR</div>
                                    <div>Stake AIUS and ETH, earn AIUS rewards.</div>
                                </div>
                                <div className="staking-block">
                                    <Image className="h-[20px] w-[auto]" src={arbius} alt="" />
                                    <div>ve-AIUS</div>
                                    <div>Lock AIUS, earn rewards over time.</div>
                                </div>
                            </div>
                        </div>
                        <div className="relative group link-with-image">
                            Models
                            <div className="p-[15px_30px] bg-[black] absolute opacity-0 ml-[-5px]"></div>
                            <div className="staking translate-x-[-40%] translate-y-[30px] hidden group-hover:flex">
                                <div className="staking-block">
                                    <Image className="h-[20px] w-[auto]" src={kandinsky} alt="" />
                                    <div>Kandinsky 2</div>
                                    <div>Stake AIUS and ETH, earn AIUS rewards.</div>
                                </div>
                                <div className="staking-block">
                                    <Image className="h-[20px] w-[auto]" src={kandinsky} alt="" />
                                    <div>Kasumi</div>
                                    <div>Lock AIUS, earn rewards over time.</div>
                                </div>
                                <div className="staking-block">
                                    <Image className="h-[20px] w-[auto]" src={kandinsky} alt="" />
                                    <div>Amica</div>
                                    <div>Lock AIUS, earn rewards over time.</div>
                                </div>
                            </div>
                        </div>
                        <div>Explorer</div>
                        <div className="link-with-image">
                            <div className="link">Docs<Image className="ext-link" src={external_link} alt="" /></div>
                        </div>
                    </div>
                    <div className="ml-[30px]">
                        <div>
                            {/*<button className="hover:bg-buy-hover transition-all ease-in duration-300 bg-[black] p-[5px_25px] rounded-[20px] text-[white] text-[14px]">Connect</button>*/}
                            <button type="button" className=" relative group bg-black py-2 px-10 rounded-full flex items-center gap-3">
                                <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-10 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="font-Sequel-Sans-Medium-Head mb-1 relative z-10 text-original-white">Connect</div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
