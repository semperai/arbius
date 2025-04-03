import React from 'react';
import Buy from './Buy/Buy';
import Democratic from './Democratic/Democratic';
import MachineLearningSection from './MachineLearningSection/MLS';
import Partners from './Partners/Partners';
import Models from './Models/Models';
import Community from './Community/Community';
import Quote from './Quote/Quote';
import Showcase from './Showcase/Showcase';
import ArbiusModels from './ArbiusModels/ArbiusModels';
import AIUS from './AIUS/AIUS';
import EACC from './EACC/EACC';
import UncensoredArbius from './UncensoredArbius/UncensoredArbius';

export default function Homepage() {
  return (
    <div>
      <MachineLearningSection />
      <Partners />
      <Models />
      <ArbiusModels />
      <AIUS />
      <Democratic />
      <UncensoredArbius />
      <EACC />
      <Community />
      <Buy />
    </div>
  );
}
