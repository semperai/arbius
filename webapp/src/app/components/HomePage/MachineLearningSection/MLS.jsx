import React from "react";
import right_arrow from "../../../assets/images/right_arrow.png";
import Image from 'next/image';

export default function MachineLearningSection(){
    return (
        <div className="bg-[url('./assets/images/peer_background.png')] bg-cover">
            <div className="w-section-width m-[auto] p-[100px_0]">
                <div className="w-[50%]">
                    <div className="text-[12px] text-blue-text">Welcome to arbius network!</div>
                    <div className="text-[50px] font-medium">Peer-to-peer machine learning.</div>
                    <div>
                        <div className="text-[14px] font-extralight">Arbius is a decentralized network for machine learning and a token with a fixed supply like Bitcoin. New coins are generated with GPU power by participating in the network. There is no central authority to create new coins. Arbius is fully open-source. Holders vote on-chain for protocol upgrades. Models operate as DAOS with custom rules for distribution and rewards, providing a way for model creators to earn income.</div>
                        <div className="flex items-center mt-[30px] gap-[20px]">
                            <div><button className="bg-[black] text-[white] flex items-center gap-[5px] justify-center p-[8px_25px] rounded-[20px]">Try now <Image className="h-[20px] w-[auto]" src={right_arrow} alt="" /></button></div>
                            <div><button className="border-[1px] p-[8px_25px] rounded-[20px]">Read Whitepaper</button></div>
                        </div>                    
                    </div>
                </div>
            </div>
        </div>
    )
}
