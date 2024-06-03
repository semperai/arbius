"use client"
import { useState } from "react";
import Image from "next/image";

export default function MobileHeader(){
    return (
        <>
            <div className='flex flex-row justify-between items-center px-3 sm:flex lg:hidden'>
                <div>
                    <Image width={150} className='md:block ' src={arbius_text} alt="Arbius text"/>
                </div>
                <div id="menu" className={`relative ${isOpen ? 'open' : ''} right-1 `} onClick={handleClick}>
                    <div id="menu-bar1" className="h-[4px] w-[29px] bg-white my-1 transition-all duration-500 ease-in-out"></div>
                    <div id="menu-bar2" className="h-[4px]  w-[29px] bg-white my-1 transition-all duration-500 ease-in-out"></div>
                    <div id="menu-bar3" className="h-[4px] w-[29px]  bg-white y-1 transition-all duration-500 ease-in-out"></div>
                </div>
            </div>
            <HamburgerMenu isOpen={isOpen} menuItems={items} setIsOpen={setIsOpen}/>
       </>
    )
}