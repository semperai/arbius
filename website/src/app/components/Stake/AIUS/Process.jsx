import React from "react"
export default function Process(){
    return(
        <div>
            <div className="bg-white-background 2xl:h-[200px] lg:h-[250px] h-auto stake-box-shadow rounded-2xl px-8 2xl:pt-8 lg:pt-10 pb-8  pt-8 box-border text-original-black">
                <div>
                    <p className="lato-bold mb-4">veAIUS Process Overview:</p>
                </div>
                <div>
                    <p className="lato-regular !font-[350] mb-2 ">Lock AIUS: Receive veAIUS NFTs.</p>
                    <p className="lato-regular !font-[350] mb-2">Vote: veAIUS holders vote weekly for AI models, earning rewards.</p>
                    <p className="lato-regular !font-[350] mb-2">Emission Distribution: Managed by voter gauges based on veAIUS governance power.</p>
                </div>
            </div>
        </div>
    )
}