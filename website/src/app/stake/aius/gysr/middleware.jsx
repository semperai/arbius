'use client';
import React from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import fetchData from '../../../Utils/getGysrData';
import Tabs from '@/app/components/Stake/GYSR/Tabs';
import TopHeaderSection from '@/app/components/Stake/GYSR/TopHeaderSection';
const Middleware = () => {
  const [data, setData] = useState(null);
  useEffect(() => {
    const getData = async () => {
      try {
        const result = await fetchData();
        setData(result.data);
        // setData(result);
      } catch (error) {
        // setError(error);
      }
    };

    getData();
  }, []);
  return (
    <div>
      <>
        {data === null ? (
          <>Loading..</>
        ) : (
          <div className='relative' id='body'>
            <TopHeaderSection data={data} />
            <Tabs data={data} />
          </div>
        )}
      </>
    </div>
  );
};

export default Middleware;
