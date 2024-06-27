import React from "react"
import Tabs from "@/app/components/Stake/GYSR/Tabs";
import TopHeaderSection from "@/app/components/Stake/GYSR/TopHeaderSection";
export default function GYSR() {
    return (
        <div className="relative" id="body">
            <TopHeaderSection/>
            <Tabs />
        </div>
    )
}