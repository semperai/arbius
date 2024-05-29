import React from "react"
import Buy from "./Buy/Buy"
import Democratic from "./Democratic/Democratic"
import MachineLearningSection from "./MachineLearningSection/MLS.jsx"
import Partners from "./Partners/Partners"
import Models from "./Models/Models"
import Community from "./Community/Community"
import Quote from "./Quote/Quote"
import Showcase from "./Showcase/Showcase"

export default function Homepage(){
    return(
        <div>
            <MachineLearningSection />
            <Partners />
            <Models />
            <Buy/>
            <Democratic/>
            <Community/>
            <Quote/>
            <Showcase/>
        </div>
    )
}