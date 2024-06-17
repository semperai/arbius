"use client";
import React, { useState, useEffect } from "react";
import Head from 'next/head';
import amica from "../../../assets/images/amica.png";
import generativeAI from "../../../assets/images/ai_generation.png";
import marketplace from "../../../assets/images/marketplace.png";
import NextImage from "next/image";
import right_arrow from "../../../assets/images/arrow.png";
import arbius_logo_round from "../../../assets/images/arbius_logo_round.png";
import { Fade } from "react-awesome-reveal";
import Link from "next/link";
export default function Models() {
  const [selectedModel, setSelectedModel] = useState("Generative AI");
  const [stopEffect, setStopEffect] = useState(false);
  const [opacity, setOpacity] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [index, setActiveIndex] = useState(0)
  const [modelFadeIn, setModelFadeIn] = useState(true);
  const AllModels = {
    "Generative AI": {
      text: "Be part of the burgeoning AI economy! Users can now share in the value generated from AI, and model creators are now able to monetize their creations, or choose to host them free of cost. Our generative AI is handled by a global decentralized network of accelerated compute solvers.",
      image: generativeAI,
      background: "bg-ai-gradient",
    },
    "Amica": {
      text: "Amica is an open source AI persona chatbot interface that provides emotion, bi-directional text to speech, audial interpretation, and visual recognition based interactions.",
      image: amica,
      background: "bg-ai-gradient",
      link: "https://amica.arbius.ai/",
    },
    "Marketplace": {
      text: "Arbius has created a one of a kind ecosystem where agents for the first time can source their own compute. True autonomy starts here! Utilizing decentralized escrow, fully autonomous agents can earn as well as purchase services from other agents and humans alike.",
      image: marketplace,
      background: "bg-ai-gradient",
    },
  };
  const [background, setBackground] = useState(AllModels["Generative AI"].background);
  const toggleBackground = (add) => {
    if (add) {
      document
        .getElementById("image-parent")
        .classList.add("model-image-gradient");
    } else {
      document
        .getElementById("image-parent")
        .classList.remove("model-image-gradient");
    }
  };
  const prefetchImages = (imageUrls) => {
    imageUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  };
  
  const renderModel = (item,index) => {
    setStopEffect(false);
    setModelFadeIn(false);
    setOpacity(false);
    setCurrentImageIndex(index);
    setTimeout(() => {
      setModelFadeIn(true);
      setOpacity(true);
      setStopEffect(true);
      setSelectedModel(item);
    },500)
    setBackground(AllModels[item].background);
  };

  useEffect(() => {
    let AllModelNames = Object.keys(AllModels);

    // Set loading state to false after prefetching
    

    
    const interval = setInterval(() => {
      let currentIndex = index + 1;

      if (currentIndex > 2) {
        currentIndex = 0;
      }
      if (!stopEffect) {
        setActiveIndex(currentIndex);
        setSelectedModel(AllModelNames[currentIndex]);
        setModelFadeIn(true)

      }
    }, 20000); // Change the interval duration to 30 seconds (30000 milliseconds)
    
    return () => {
      clearInterval(interval)
      // clearInterval(loadingTimeout)
    };
  }, [index, stopEffect,AllModels]);
  useEffect(() => {
    console.log(modelFadeIn)
    if (modelFadeIn && !stopEffect) {
      const timer = setTimeout(() => {
        setModelFadeIn(false);
      }, 19500);

      return () => clearTimeout(timer);
    }
  }, [modelFadeIn]);

  return (
    <div className={`bg-democratic-gradient lg:${background} bg-cover lato-bold`}>
      <div className="w-mobile-section-width lg:w-section-width m-[auto] py-24 max-w-center-width flex  flex-col lg:flex-row justify-between items-center">
        <div className="w-full lg:w-[50%]">
          <div className="text-[16px] lg:text-[12px] mb-2 lg:mb-0 Gradient-transparent-text bg-button-gradient-txt">
            Our Models!
          </div>
          <div className="lg:text-header 2xl:text-header-2xl text-mobile-header font-medium text-black-text mb-6">
            <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
              DeFi for AI
            </Fade>
          </div>
          <Fade direction="up" triggerOnce={true}>
            <div>
              <div className="text-para text-subtext-three lato-regular text-subtext-two">
              OSS (open source software) models such as Llama 3 and others can now be part of a shared AI economy for all. Arbius handles accelerated compute matchmaking for each request, pairing the best solvers to each task for rewards. Through its utility, ecosystem participants can steer the economy and share in the value generated from&nbsp;AI&nbsp;.
              </div>
            </div>
          </Fade>
          <Fade direction="up" triggerOnce={true} className="hidden lg:block">
            <div className="mt-[30px]">
              <div className="all-models flex model-items w-full justify-between">
                {Object.keys(AllModels).map(function (item, index) {
                  return (
                    <div
                      className={`
                        ${selectedModel === item ? "selected" : "non-selected"} hover:text-purple-text`
                      }
                      onClick={() => {
                        renderModel(item,index);
                      }}
                      key={index}
                    >
                      {item}
                    </div>
                  );
                })}
              </div>
              <Fade direction="top">
                <div className="mt-[30px]">
                  <div className={`text-[28px]  font-medium {/*Gradient-transparent-text bg-background-gradient-txt*/} text-blue-text  model-container ${modelFadeIn || stopEffect ? "fade-in" : ""} ${opacity ? "opacity-100" : "opacity-0"}`}>
                    {selectedModel}
                  </div>
                  <div className={`mt-[10px]  w-[80%] text-subtext-two lato-regular lg:h-[180px]  model-container ${modelFadeIn || stopEffect ? "fade-in" : ""} ${opacity ? "opacity-100" : "opacity-0"}`}>
                    {AllModels[selectedModel].text}

                    <div>
                      {AllModels[selectedModel].link && (
                        <Link href={"https://amica.arbius.ai/"} target="_blank">
                          <button
                            type="button"
                            className={` relative group bg-black py-2 px-8 rounded-full flex items-center gap-3 mt-[20px] overflow-hidden model-container ${modelFadeIn || stopEffect ? "fade-in" : ""}`}
                          >
                            <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-8 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="lato-bold  relative z-10 text-original-white">
                              Try now
                            </div>
                            <NextImage
                              src={right_arrow}
                              width={18}
                              className="relative z-10"
                              alt="right arrow"
                            />
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </Fade>
            </div>
          </Fade>
        </div>
        
        <Fade direction="up" triggerOnce={true} className=" lg:block lg:w-[50%]">
      <div className="2xl:ml-[20%]">
        <div
          id="image-parent"
          className={`hidden lg:flex relative border-[transparent] w-[320px] h-[430px]  justify-center items-center rounded-[50px] ml-[auto] 2xl:m-[auto]`}
        >
          {Object.keys(AllModels).map((model, index) => (
            
            <NextImage
              key={index}
              className={`absolute top-0 left-0 h-[500px] w-[auto] transition-opacity duration-500 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
              src={AllModels[model].image}
              alt=""
              priority
              onMouseOver={() => toggleBackground(true)}
              onMouseOut={() => toggleBackground(false)}
            />
          ))}
          <span className="hidden absolute top-[20px] right-[20px] text-[11px] text-[white] p-[10px_25px] rounded-[20px] backdrop-blur">
            Generated by kandinsky 2
          </span>
          <span className="absolute bottom-[15px] right-[20px]">
            {/* <NextImage
              className="h-[50px] w-[auto]"
              src={arbius_logo_round}
              alt=""
            /> */}
          </span>
        </div>
      </div>
    </Fade>
        {/* Mobile View starts here */}
        <div className="block lg:hidden mt-8">
          {Object.keys(AllModels).map((item, key) => {
            return (
              <div key={key} className={key === Object.keys(AllModels).length -1 ? "":"mb-[4rem]"}>
                <Fade direction="up" triggerOnce={true}>
                  <div className="">
                    <div
                      id="image-parent"
                      className="relative border-[transparent] w-full h-[240px] flex justify-center items-center rounded-[50px]"
                    >
                      <div className="relative">
                        <NextImage
                          className="h-[240px] w-[full] object-cover rounded-[20px]"
                          src={AllModels[item].image}
                          objectFit="cover"
                          alt=""
                          onMouseOver={() => toggleBackground(true)}
                          onMouseOut={() => toggleBackground(false)}
                        />
                      </div>
                    </div>
                  </div>
                </Fade>
                <Fade direction="up" triggerOnce={true}>
                  <div className="mt-[10px]">
                    <div className="text-[28px] lg:mb-0 mb-4 lg:mt-0 mt-4 font-medium /*Gradient-transparent-text bg-background-gradient-txt*/ text-blue-text">
                      {item}
                    </div>
                    <div className=" mb-[10px] w-full text-subtext-two lato-regular">
                      {AllModels[item].text}
                    </div>
                    <div>
                      {AllModels[item].link && (
                        <Link href={"https://amica.arbius.ai/"} target="_blank">
                          <button
                            type="button"
                            className=" relative group bg-black py-2 px-8 rounded-full flex items-center gap-3 mt-5"
                          >
                            <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-8 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="lato-bold  relative z-10 text-original-white">
                              Try now
                            </div>
                            <NextImage
                              src={right_arrow}
                              width={18}
                              className="relative z-10"
                              alt="right arrow"
                            />
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Fade>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
