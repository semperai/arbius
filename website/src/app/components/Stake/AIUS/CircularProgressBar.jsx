import AnimatedProgressProvider from "./AnimatedProgressBarProvider";
import { CircularProgressbarWithChildren, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { easeQuadInOut } from "d3-ease";
function CircularProgressBar({ valueStart, valueEnd, duration, text, setShowPopUp, step, isError, noChildren = false, repeat = true }) {

    return (
        repeat ? (
            <div className="animate-spin-loader">

                <CircularProgressbarWithChildren
                    value={70}

                    styles={buildStyles({ pathTransition: "none", trailColor: "#f3f3fb", pathColor: "#4A28FF" })}
                    className="w-full h-full text-original-black"
                >
                    <div className={!noChildren ? "flex justify-center items-center text-original-black" : "hidden"}>
                        <div>
                            <h1 className="text-base opacity-40 my-0 text-center">Step</h1>
                            <h1 className="text-[40px] font-semibold  text-center">{text}</h1>
                        </div>


                    </div>
                </CircularProgressbarWithChildren>

            </div>

        ) : (<AnimatedProgressProvider
            valueStart={valueStart}
            valueEnd={valueEnd}
            duration={4}
            easingFunction={easeQuadInOut}
            setShowPopUp={setShowPopUp}
            step={step}
            isError={isError}
            repeat={repeat}


        >
            {(value) => {
                // const roundedValue = Math.round(value);
                return (
                    <CircularProgressbarWithChildren
                        value={value}

                        styles={buildStyles({ pathTransition: "none", trailColor: "#f3f3fb", pathColor: "#4A28FF" })}
                        className="w-full h-full text-original-black"
                    >
                        <div className={!noChildren ? "flex justify-center items-center text-original-black" : "hidden"}>
                            <div>
                                <h1 className="text-base opacity-40 my-0 text-center">Step</h1>
                                <h1 className="text-[40px] font-semibold  text-center">{text}</h1>
                            </div>


                        </div>
                    </CircularProgressbarWithChildren>
                );
            }}
        </AnimatedProgressProvider>)
    )
}

export default CircularProgressBar;