"use client"
import React, { useState,useEffect } from "react"
import fetchData from "../../Utils/getGysrData";
import Tabs from "@/app/components/Stake/GYSR/Tabs";
import TopHeaderSection from "@/app/components/Stake/GYSR/TopHeaderSection";
import { getTransactions } from "../../Utils/getActivities";
export default function GYSR() {
  const [data, setData] = useState(null)
    useEffect(() => {
     
    
    const getData = async () => {
      try {
        const result = await fetchData();
        setData(result.data)
        // setData(result);
      } catch (error) {
        // setError(error);
      }
    };
  
    getData();
    getTransactions()
  }, []);
  
    return (
      <>
      {
          data===null
          ?<>Loading..</>
          :<div className="relative" id="body">
          <TopHeaderSection data={data} />
          <Tabs data={data} />
      </div>
        }</>
        
    )
}