import React from 'react';

export default function Steps() {
  const steps = [
    'Select the amount of AIUS you want to lock.',
    'Select the duration, the minimum lock time is one week, and the maximum lock time is two years.',
    'Confirm the lock duration.',
    'Details about your lock will be available inside the dashboard.',
  ];

  return (
    <div className='stake-box-shadow box-border flex h-auto items-start justify-start rounded-2xl bg-white-background p-8 lg:h-[270px]'>
      <div className='container mt-2'>
        <div className='steps-container'>
          {steps.map((step, index) => (
            <div key={index} className='step-item'>
              <div className='step-circle'>{index + 1}</div>
              <p className='step-text'>{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
