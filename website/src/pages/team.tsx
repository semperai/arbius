'use client';
import React, { useEffect, useState } from 'react';
import RootLayout from '@/app/layout';
import ArbiusLogo from '@/app/assets/images/arbius_logo_team_page.svg';
import TelegramIcon from '@/app/assets/images/telegram_icon_team.svg';
import Image from 'next/image';

import Beskay from '@/app/assets/images/team/beskay.png';
import MasterPig from '@/app/assets/images/team/master_pig.png';
import Oscar from '@/app/assets/images/team/oscar.png';
import Charlie from '@/app/assets/images/team/charlie.png';
import DeeDaz from '@/app/assets/images/team/deedaz.png';
import Kasumi from '@/app/assets/images/team/kasumi.png';
import Damien from '@/app/assets/images/team/damien.png';

import TeamBackground from '@/app/assets/images/team/team_background.jpg';

export default function Team() {

  const team_data = [
    {
      "name": "Kasumi",
      "title": "Founder & Vision Lead",
      "telegram": "kasumi_null",
      "image": Kasumi,
      "telegram_bg": "bg-[#ffffff]/70",
      "title_bg": "bg-[#ffffff]/70"
    },
    {
      "name": "J Master Pig",
      "title": "Operations Lead",
      "telegram": "slowsynapse",
      "image": MasterPig,
      "telegram_bg": "bg-[#ffffff]/70",
      "title_bg": "bg-[#ffffff]/70"
    },
    {
      "name": "Beskay",
      "title": "Developer",
      "telegram": "beskay0x",
      "image": Beskay,
      "telegram_bg": "bg-[#ffffff]/70",
      "title_bg": "bg-[#ffffff]/70"
    },
    {
      "name": "Damien",
      "title": "Developer",
      "telegram": "",
      "image": Damien,
      "title_bg": "bg-[#ffffff]/70"
    },
    {
      "name": "DeeDaz",
      "title": "UX Designer",
      "telegram": "",
      "image": DeeDaz,
      "title_bg": "bg-[#ffffff]/70"
    },
    {
      "name": "Charlie",
      "title": "Social Media Manager",
      "telegram": "charliesjv",
      "image": Charlie,
      "telegram_bg": "bg-[#D3D3D3]/90",
      "title_bg": "bg-[#BEB5B5]/70"
    },
    {
      "name": "Oscar",
      "title": "Graphics & Video Lead",
      "telegram": "osalas08",
      "image": Oscar,
      "telegram_bg": "bg-[#D3D3D3]/90",
      "title_bg": "bg-[#ffffff]/70"
    }
  ]

  return (
    <RootLayout>
      <div style={{ backgroundImage: `url(${TeamBackground.src})` }} className="pb-8 bg-cover bg-center">
        <div className="w-[90%] md:w-[80%] max-w-[1300px] m-[auto] text-black-text lato-regular">
          <div className="pt-[110px] mb-2"><Image className="h-[50px] w-[auto] lm:h-[auto]" src={ArbiusLogo} alt="" /></div>
          <div className="text-[36px] lm:text-[48px] mb-2">Meet Our team</div>
          <div className="w-[auto] lm:w-[380px] mb-8">Meet the passionate and talented team bringing free and open AI to the world.</div>

          <div className="">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              { team_data.map(function(item, index){
                return <div key={index} className={`relative ${index === 8 ? "xl:col-start-2" : index === 9 ? "lg:col-start-2 xl:col-start-3" : ""}`}>
                        <Image src={item.image} alt={item.name} />
                        { item.telegram ? <div className={`absolute top-[5px] lm:top-[10px] right-[5px] lm:right-[10px] flex items-center gap-[2px] p-1 md:p-2 rounded-[15px] ${item.telegram_bg} backdrop-blur`}>
                          <Image className="h-[15px] w-auto md:h-[18px]" src={TelegramIcon} alt="telegram" />
                          <div className="text-[11px] md:text-[13px]">@{item.telegram}</div>
                        </div> : null }
                        
                        <div className={`w-[95%] absolute bottom-[5px] lm:bottom-[10px] left-[2.5%] flex flex-col items-center p-1 md:p-2 rounded-[15px] ${item.title_bg} backdrop-blur`}>
                          <div className="text-[#0A0047] text-[13px] md:text-[16px]">{item.name}</div>
                          <div className="text-[#0A0047]/70 text-[12px] md:text-[14px]">{item.title}</div>
                        </div>
                      </div>
              }) }
            </div>
          </div>
        </div>
      </div>
    </RootLayout>
  )
}
