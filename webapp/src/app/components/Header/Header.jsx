"use client";
import React, { useState, useEffect } from "react";
import ArbiusLogo from "../../assets/images/arbius_logo.png";
import external_link from "../../assets/images/external_link.png";
import down_arrow from "../../assets/images/down_arrow.png";
import amica_l from "../../assets/images/amica_l.png";
import kasumi_l from "../../assets/images/kasumi_l.png";
import arbius from "../../assets/images/arbius_logo_without_name.png";
import gysr from "../../assets/images/gysr_logo_without_name.png";
import kandinsky from "../../assets/images/kandinsky.png";
import Image from "next/image";
import AnimateHeight from "react-animate-height";
import Link from "next/link";
export default function Header() {
  const [headerOpen, setHeaderOpen] = useState(false);
  const [stakingOpen, setStakingOpen] = useState(true);
  const [modelsOpen, setModelsOpen] = useState(true);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setStakingOpen(false);
      setModelsOpen(false);
    }
  }, []);

  return (
    <div
      className={`${
        headerOpen ? "w-[100%] fixed" : "relative"
      } bg-[white] z-[9999]`}
    >
      <div className="flex justify-between py-4 w-[90%] m-auto max-w-center-width">
        <div className="flex items-center">
          <Image
            className="h-[40px] w-[auto]"
            src={ArbiusLogo}
            alt="Arbius Logo"
          />
        </div>
        <div
          className={`${
            headerOpen ? "w-[100%]" : "w-[0%]"
          } flex lg:items-center lg:no-fixed-element fixed-element overflow-auto lg:overflow-visible flex-col lg:flex-row`}
        >
          <div className="links-parent mt-[30px] text-[24px] text-[original-black] w-[100%] m-[auto] flex-col items-start flex justify-between lg:w-[auto] lg:flex-row lg:items-center gap-[40px] link-block lg:m-[auto] lg:text-[16px] lg:text-[gray]">
            <Link href={"https://arbius.ai/generate"} target="_blank">
              <div className="item hover:text-purple-text">Generate</div>
            </Link>

            <div className="link-with-image relative group w-[auto]">
              <div
                className="link hover:!text-purple-text"
                onClick={() => setStakingOpen(!stakingOpen)}
              >
                Staking
                <Image
                  className="ext-link hidden lg:block"
                  src={external_link}
                  alt=""
                />
                <Image
                  className={`${
                    stakingOpen ? "rotate-[180deg]" : ""
                  } transition mobile-height ext-link block lg:hidden`}
                  src={down_arrow}
                  alt=""
                />
              </div>
              <div className="p-[15px_30px] bg-[black] absolute opacity-0"></div>
              <AnimateHeight height={stakingOpen ? "auto" : 0}>
                <div className="lg:staking lg:translate-x-[-30%] lg:translate-y-[25px] lg:hidden lg:group-hover:flex ">
                  <Link
                    href={
                      "https://app.gysr.io/pool/0xf0148b59d7f31084fb22ff969321fdfafa600c02?network=ethereum"
                    }
                    target="_blank"
                  >
                    <div className="staking-block">
                      <Image
                        className="w-[20px] h-[auto] lg:h-[20px] lg:w-[auto]"
                        src={gysr}
                        alt=""
                      />
                      <div>GYSR</div>
                      <div>Stake AIUS and ETH, earn AIUS rewards.</div>
                    </div>
                  </Link>
                  <Link
                    href={"https://swap.cow.fi/#/1/swap/WETH/AIUS"}
                    target="_blank"
                  >
                    <div className="staking-block">
                      <Image
                        className="w-[20px] h-[auto] lg:h-[20px] lg:w-[auto]"
                        src={arbius}
                        alt=""
                      />
                      <div>ve-AIUS</div>
                      <div>Lock AIUS, earn rewards over time.</div>
                    </div>
                  </Link>
                </div>
              </AnimateHeight>
            </div>
            <div className="relative group link-with-image">
              <div
                className="link hover:!text-purple-text"
                onClick={() => setModelsOpen(!modelsOpen)}
              >
                Models
                <Image
                  className={`${
                    modelsOpen ? "rotate-[180deg]" : ""
                  } transition mobile-height inline ext-link block lg:hidden`}
                  src={down_arrow}
                  alt=""
                />
              </div>
              <div className="p-[15px_30px] bg-[black] absolute opacity-0 ml-[-5px]"></div>
              <AnimateHeight height={modelsOpen ? "auto" : 0}>
                <div className="lg:staking lg:translate-x-[-40%] lg:translate-y-[25px] lg:hidden lg:group-hover:flex">
                  <Link href={"https://arbius.ai/generate"} target="_blank">
                    <div className="staking-block">
                      <Image
                        className="w-[20px] h-[auto] lg:h-[20px] lg:w-[auto]"
                        src={kandinsky}
                        alt=""
                      />
                      <div>Kandinsky 2</div>
                      <div>Image Generation</div>
                    </div>
                  </Link>
                  <Link target="_blank" href={"https://t.me/kasumi2_beta"}>
                    <div className="staking-block">
                      <Image
                        className="w-[20px] h-[auto] lg:h-[20px] lg:w-[auto]]"
                        src={kasumi_l}
                        alt=""
                      />
                      <div>Kasumi</div>
                      <div>Telegram Integrated Mining Agent & Image Generator</div>
                    </div>
                  </Link>
                  <Link target="_blank" href={"https://amica.arbius.ai/"}>
                    <div className="staking-block">
                      <Image
                        className="w-[20px] h-[auto] lg:h-[20px] lg:w-[auto]"
                        src={amica_l}
                        alt=""
                      />
                      <div>Amica</div>
                      <div>AI persona</div>
                    </div>
                  </Link>
                </div>
              </AnimateHeight>
            </div>

            <Link href={"https://arbius.ai/explorer"} target="_blank">
              <div className="item hover:text-purple-text">Explorer</div>
            </Link>

            <Link href={"https://docs.arbius.ai/"} target="_blank">
              <div className="link-with-image">
                <div className="link hover:!text-purple-text">
                  Docs
                  <Image className="ext-link" src={external_link} alt="" />
                </div>
              </div>
            </Link>

            <div className="item lg:hidden hover:!text-purple-text">Media</div>
          </div>
          <div className="hidden lg:block relative mt-[20px] mb-[100px] lg:mt-[0] lg:ml-[36px] lg:mb-[0]">
            <div>
              {/*<button className="hover:bg-buy-hover transition-all ease-in duration-300 bg-[black] p-[5px_25px] rounded-[20px] text-[white] text-[14px]">Connect</button>*/}
              <button
                type="button"
                className="m-[auto] relative group bg-black p-[10px_50px] lm:p-[10px_150px] lg:py-2 lg:px-10 rounded-full flex items-center gap-3"
              >
                <div class="absolute w-[100%] h-[100%] left-0 z-0 p-[10px_50px] lm:p-[10px_150px] lg:py-2 lg:px-10 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="font-Sequel-Sans-Medium-Head relative mt-[-1.5px] z-10 text-original-white">
                  Connect
                </div>
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center lg:hidden MobileHeader">
          <div
            id="menu"
            className={`relative ${headerOpen ? "open" : ""} right-1 `}
            onClick={() => setHeaderOpen(!headerOpen)}
          >
            <div
              id="menu-bar1"
              className="h-[2px] w-[29px] bg-hamburger-background my-2 rounded-[20px] transition-all duration-500 ease-in-out"
            ></div>
            <div
              id="menu-bar3"
              className="h-[2px] w-[29px]  bg-hamburger-background my-2 rounded-[20px] transition-all duration-500 ease-in-out"
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
