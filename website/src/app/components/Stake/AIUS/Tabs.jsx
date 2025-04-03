'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

import DashBoard from './DashBoard';
import Gauge from './Gauge';

const tabs = ['Dashboard', 'Gauge'];

function Tabs({
  selectedtab,
  setSelectedTab,
  data,
  isLoading,
  isError,
  protocolData,
  updateValue,
  setUpdateValue,
}) {
  const router = useRouter();
  const { section } = router.query; // Extracts URL param (e.g., ?section=contact)

  useEffect(() => {
    if (section && typeof section === 'string') {
      // Wait for the page to fully render before scrolling
      setTimeout(() => {
        const element = document.getElementById(section);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          setSelectedTab(section)
        }
      }, 100); // Small delay to ensure DOM is ready
    }
  }, [section]); // Trigger effect when URL param changes

  return (
    <>
      <div className='m-[auto] w-mobile-section-width max-w-center-width lg:w-section-width'>
        <div className='flex justify-start'>
          <div className='all-stake stake-items flex w-full justify-between font-[600] lg:w-[30%]'>
            {tabs.map(function (item, index) {
              return (
                <div
                  className={` ${selectedtab === item ? 'selected' : 'non-selected'} hover:text-purple-text`}
                  onClick={() => {
                    setSelectedTab(item);
                  }}
                  key={index}
                  id={item}
                >
                  {item}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className='relative min-w-full max-w-center-width bg-aius-stake'>
        {selectedtab === 'Dashboard' ? (
          <DashBoard
            data={data}
            isLoading={isLoading}
            isError={isError}
            protocolData={protocolData}
            updateValue={updateValue}
            setUpdateValue={setUpdateValue}
          />
        ) : (
          <Gauge
            updateValue={updateValue}
            setUpdateValue={setUpdateValue}
          />
        )}
      </div>
    </>
  );
}

export default Tabs;
