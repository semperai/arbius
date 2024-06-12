import React,{useState} from "react"
import Image from "next/image";
import small_arrow from '@/app/assets/images/small_arrow.png'
export default function Carousel({cardsData}){
    const [current, setCurrent] = useState(0);
    const length = cardsData.length;
    const nextSlide = () => {
        setCurrent(current === length - 1 ? 0 : current + 1);
      };
    
      const prevSlide = () => {
        setCurrent(current === 0 ? length - 1 : current - 1);
      };
    
    return(
        <div className="relative mt-4">
            <div className=" w-[100%] overflow-hidden flex">
                {
                    cardsData.map((card)=>{
                        return (
                            <div className={`  ${card.background} w-[100%] transition-transform duration-500 ease-in-out min-w-[100%] bg-no-repeat bg-cover rounded-3xl p-10 `} key={card.id}  style={{ transform: `translate(-${current * 100}%)` }}>
                                <div className="mb-10">
                                    <Image src={card.icon} alt={card.title} width={20}/>
                                </div>
                                <div>
                                    <h3 className="text-card-heading lato-bold text-[25px]">{card.title}</h3>
                                </div>
                                <div>
                                    <p className="text-card-heading lato-regular text-[16px] mt-6">{card.content}</p>
                                </div>
                            </div>
                        )
                    })
                }
            </div>
            <div>
               <div className="flex items-center justify-end mt-6 gap-4">
                   <div className="bg-white-background w-[60px] h-[60px] p-4 flex items-center justify-center marquee-shadow rounded-2xl" onClick={prevSlide}>
                        <Image className="rotate-[-180deg]" src={small_arrow} width={10} alt="left arrow"/> 
                   </div>  
                   <div className="bg-white-background w-[60px] h-[60px] p-4 flex items-center justify-center marquee-shadow rounded-2xl" onClick={nextSlide}>
                        <Image src={small_arrow}  width={10} alt="right arrow"/>
                    </div>   
               </div>
            </div>
        </div>
    )
}

