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
        let interval;
        if(repeat)
        setIsAnimated(true);
        if (repeat) {
            interval = window.setInterval(() => {
                setIsAnimated(prevIsAnimated => !prevIsAnimated);
            }, duration * 1000);
        } else {
            setIsAnimated(true);
        }
        return () => {
            window.clearInterval(interval);
        };
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

    return (
        <Animate
            start={() => ({
                value: valueStart
            })}
            update={() => ({
                value: [isAnimated ? valueEnd : valueStart],
                timing: {
                    duration: duration * 1000,
                    ease: easingFunction
                }
            })}

            
        >
            {({ value }) => children(value)}
        </Animate>
    );
};

export default AnimatedProgressProvider;
