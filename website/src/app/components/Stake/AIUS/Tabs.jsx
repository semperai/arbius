'use client';

import React, { useState } from 'react';
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
  // const [selectedtab, setSelectedTab] = useState("Dashboard")
  console.log(updateValue, 'Value updated in TABS');
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
