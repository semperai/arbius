import React, { useState, useEffect } from "react";
import { Animate } from "react-move";

const AnimatedProgressProvider = ({
    valueStart=0,
    valueEnd,
    duration,
    easingFunction,
    repeat=true,
    children,
    setShowPopUp,
    step,
    isError
}) => {
    const [isAnimated, setIsAnimated] = useState(false);
    

    useEffect(() => {
        // let interval;
        if(repeat)
        setIsAnimated(true);
        if (repeat) {
          
        } else {
            setIsAnimated(true);
        }
        // return () => {
        //     window.clearInterval(interval);
        // };
    }, [repeat, duration]);

    /*useEffect(()=>{
        setTimeout(() => {
            console.log("COMPLETED")
            if(isError)
                setShowPopUp("Error")
            else if(step === 1)
            setShowPopUp(2)
            else if(step === 2)
            setShowPopUp("Success")
            // setShowPopUp(false)
        }, (duration +1)* 1000)
    },[])*/
    const [animationKey, setAnimationKey] = useState(0);

    useEffect(() => {
        if (repeat) {
            const interval = window.setInterval(() => {
                setAnimationKey(prevKey => prevKey + 1);
            }, duration * 1000);

            return () => {
                window.clearInterval(interval);
            };
        } else {
            setAnimationKey(1);
        }
    }, [repeat, duration]);
    

    return (
        <Animate
            start={() => ({
                value: valueStart
            })}
            enter={() => ({
                value: [valueEnd],
                timing: {
                    duration: duration * 1000,
                    ease: easingFunction
                }
            })}
            key={animationKey}
            
            
        >
            {({ value }) => children(value)}
        </Animate>
    );
};

export default AnimatedProgressProvider;
