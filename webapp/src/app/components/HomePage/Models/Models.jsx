"use client"
import React, {useState} from "react"
import amica from "../../../assets/images/amica.png"
import Image from 'next/image';
import right_arrow from "../../../assets/images/right_arrow.png";

export default function Models(){

    const [selectedModel, setSelectedModel] = useState("Amica");
    const AllModels = {
        "AI Generations": {
            "text": "Amica is an open source chatbot interface that provides emotion, text to speech, and speech to text capabilities.",
            "image": amica
        },
        "Amica": {
            "text": "Amica is an open source chatbot interface that provides emotion, text to speech, and speech to text capabilities.",
            "image": amica
        },
        "Marketplace": {
            "text": "Amica is an open source chatbot interface that provides emotion, text to speech, and speech to text capabilities.",
            "image": amica
        }
    }

    return(
        <div className="bg-models-gradient bg-cover">
            <div className="w-section-width m-[auto] p-[100px_0] max-w-center-width flex justify-between items-center">
                <div className="w-[50%]">
                    <div className="text-[12px] text-blue-text">Our Models!</div>
                    <div className="text-header font-medium">Defi for AI</div>
                    <div>
                        <div className="text-para font-extralight">Model creators are now first-class citizens. Set your fees (or choose not to) for using your models and enable investments in them as tokenized assets. Model generations are handled by a global, decentralized network of solvers competing to deliver results swiftly.</div>
                    </div>
                    <div className="mt-[30px]">
                        <div className="all-models flex model-items w-full justify-between">
                            {
                                Object.keys(AllModels).map(function(item, index){
                                    return <div className={selectedModel === item ? "selected" : "non-selected"} onClick={()=>setSelectedModel(item)}>{item}</div>
                                })
                            }
                            {/*<div>AI Generations</div>
                            <div className="selected">Amica</div>
                            <div>Marketplace</div>*/}
                        </div>
                        <div className="mt-[30px]">
                            <div className="text-blue-text text-[28px] font-medium">{selectedModel}</div>
                            <div className="mt-[10px] mb-[20px] w-[60%] font-extralight">{AllModels[selectedModel].text}</div>
                            <div><button className="hover:bg-background-gradient transition-all ease-in duration-300 bg-[black] text-[white] flex items-center gap-[5px] justify-center p-[8px_25px] rounded-[20px]">Try now <Image className="h-[20px] w-[auto]" src={right_arrow} alt="" /></button></div>
                        </div>
                    </div>
                </div>
                <div className="">
                    <div>
                        <Image className="h-[400px] w-[auto]" src={AllModels[selectedModel].image} alt="" />
                    </div>
                </div>
            </div>
        </div>
    )
}