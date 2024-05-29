import React from "react"
import Buy from "./Buy/Buy"
import Democratic from "./Democratic/Democratic"
import MachineLearningSection from "./MachineLearningSection/MLS.jsx"
import Partners from "./Partners/Partners"
import Models from "./Models/Models"

export default function Homepage(){
    return(
        <div>
            <MachineLearningSection />
            <Partners />
            <Models />
            <Buy/>
            <Democratic/>
        </div>
    )
}