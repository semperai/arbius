import React, { useEffect, useState } from 'react';
// import Slider from './Slider'
import SlidingCards from './SlidingCards';
import Image from 'next/image';
import aius_icon from '../../../assets/images/aius_icon.png';
import gysr_logo_wallet from '../../../assets/images/gysr_logo_wallet.png';
import GanttChart from './GanttChart';
import { useAccount, useReadContract, useChainId } from 'wagmi';
import veStaking from '../../../abis/veStaking.json';
import votingEscrow from '../../../abis/votingEscrow.json';
import baseTokenV1 from '../../../abis/baseTokenV1.json';
import Config from '@/config.one.json';

import { getAPR } from '../../../Utils/getAPR';
// import { walletBalance } from '../../../Utils/getAiusBalance'
import { BigNumber } from 'ethers';
import { fetchArbiusData } from '../../../Utils/getArbiusData';
// import { AIUS_wei } from "../../../Utils/constantValues";
import { getTokenIDs } from '../../../Utils/gantChart/contractInteractions';
import { AIUS_wei, t_max, infuraUrl, alchemyUrl } from '../../../Utils/constantValues';
import Loader from '../Loader/Index';
import Gantt from './GanttChartTest';
import { getWeb3 } from '@/app/Utils/getWeb3RPC';

function DashBoard({
  data,
  isLoading,
  isError,
  protocolData,
  updateValue,
  setUpdateValue,
}) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  console.log(updateValue, 'value updated in DashBoard');
  console.log(chainId, 'CONNECTed chain');
  console.log('IS CONNECTed?', isConnected);

  //const walletBalance = data && !isLoading ? BigNumber.from(data._hex) / AIUS_wei : 0;
  const [walletBalance, setWalletBalance] = useState(0);
  const [rewardRate, setRewardRate] = useState(0);
  const [totalSupply, setTotalSupply] = useState(0);
  const [veSupply, setVeSupply] = useState(0);
  const [escrowBalanceData, setEscrowBalanceData] = useState(0);
  const [tokenIDs, setTokenIDs] = useState([]);
  const [windowStartDate, setWindowStartDate] = useState(
    new Date('2024-02-20')
  );
  const [windowEndDate, setWindowEndDate] = useState(new Date('2026-02-20'));
  const [noCols, setNoCols] = useState(
    (windowEndDate?.getFullYear() - windowStartDate?.getFullYear()) * 12 +
      windowEndDate?.getMonth() -
      windowStartDate?.getMonth()
  );
  const [loading, setLoading] = useState(false);

  const { data: rewardRateData } = useReadContract({
    address: Config.veStakingAddress,
    abi: veStaking.abi,
    functionName: 'rewardRate',
    args: [],
  });

  const { data: totalSupplyData } = useReadContract({
    address: Config.veStakingAddress,
    abi: veStaking.abi,
    functionName: 'totalSupply',
    args: [],
  });

  const { data: veSupplyData } = useReadContract({
    address: Config.votingEscrowAddress,
    abi: votingEscrow.abi,
    functionName: 'supply',
    args: [],
  });

  const veAIUSBalance = (staked, startDate, endDate) => {
    const t = endDate - startDate;
    const a_b = staked + 0;
    return a_b * (t / t_max);
  };
  const getMonthDifference = (startDate, endDate) => {
    //console.log(startDate, "STARTDATE", startDate.getMonth(), endDate)
    let diff =
      startDate.getFullYear() * 12 +
      startDate.getMonth() -
      (endDate.getFullYear() * 12 + endDate.getMonth());
    return diff;
  };
  // const [walletBalance, setWalletBalance] = useState(0);
  // const [protocolData, setProtocolData] = useState([]);
  /*const rewardRate = useContractRead({
        address: Config.veStakingAddress,
        abi: veStaking.abi,
        functionName: 'rewardRate',
        args: [],
        enabled: isConnected
    })

    const totalSupply = useContractRead({
        address: Config.veStakingAddress,
        abi: veStaking.abi,
        functionName: 'totalSupply',
        args: [],
        enabled: isConnected
    })

    const { data: veSupplyData, isLoading: veSupplyIsLoading, isError: veSupplyIsError } = useContractRead({
        address: Config.votingEscrowAddress,
        abi: votingEscrow.abi,
        functionName: 'supply',
        args: [],
        enabled: isConnected
    })*/

  useEffect(() => {
    if (rewardRateData) {
      setRewardRate(Number(rewardRateData));
    }
    if (totalSupplyData) {
      setTotalSupply(Number(totalSupplyData));
    }
    if (veSupplyData) {
      setVeSupply(Number(veSupplyData));
    }
  }, [rewardRateData, totalSupplyData, veSupplyData]);

  useEffect(() => {

    const f1 = async () => {
      try{
        const web3 = await getWeb3();

        const veStakingContract = new web3.eth.Contract(
          veStaking.abi,
          Config.veStakingAddress
        );
        const votingEscrowContract = new web3.eth.Contract(
          votingEscrow.abi,
          Config.votingEscrowAddress
        );

        const _rewardRate = await veStakingContract.methods.rewardRate().call();
        const _totalSupply = await veStakingContract.methods.totalSupply().call();
        const _veSupplyData = await votingEscrowContract.methods.supply().call();

        setRewardRate(_rewardRate / AIUS_wei);
        setTotalSupply(_totalSupply / AIUS_wei);
        setVeSupply(_veSupplyData);
      }catch(e){
        console.log("F1 error", e)
      }
    }

    const f = async () => {
      setLoading(true);
      //alert("Address changed calling again" + address)
      try {
        const web3 = await getWeb3()
        const votingEscrowContract = new web3.eth.Contract(
          votingEscrow.abi,
          Config.votingEscrowAddress
        );
        const veStakingContract = new web3.eth.Contract(
          veStaking.abi,
          Config.veStakingAddress
        );
        const baseTokenContract = new web3.eth.Contract(
          baseTokenV1.abi,
          Config.baseTokenAddress
        );

        const _rewardRate = await veStakingContract.methods.rewardRate().call();
        const _totalSupply = await veStakingContract.methods
          .totalSupply()
          .call();
        const _veSupplyData = await votingEscrowContract.methods
          .supply()
          .call();

        setRewardRate(_rewardRate / AIUS_wei);
        setTotalSupply(_totalSupply / AIUS_wei);
        setVeSupply(_veSupplyData);

        // Getting user wallet balance
        const wBal = await baseTokenContract.methods.balanceOf(address).call();
        setWalletBalance(wBal);

        // prepiing sliding cards and ganttChart
        const _escrowBalanceData = await votingEscrowContract.methods
          .balanceOf(address)
          .call();
        setEscrowBalanceData(_escrowBalanceData);
        let tokens = await getTokenIDs(address, _escrowBalanceData);

        //alert(_escrowBalanceData.toString() + "and" + tokens.length?.toString())
        console.log(_escrowBalanceData, tokens, 'escrowBalance and tokens');

        // ganttChart
        let mergedTokensData = {
          slidingCards: {},
          ganttChart: {},
        };
        let finalStakingData = {
          firstUnlockDate: 0,
          firstUnlockDateHours: 0,
          firstUnlockDateMinutes: 0,
          totalStaked: 0,
          totalGovernancePower: 0,
          allStakes: [],
        };
        console.log(
          mergedTokensData,
          finalStakingData,
          'stake cards and gantt chart data, All stake data'
        );

        let lastDate = 0;
        let earliestDate = 0;
        tokens.forEach((token) => {
          if (Number(token?.locked__end) > lastDate) {
            lastDate = Number(token?.locked__end);
            //console.log(lastDate, "LAST DATE")
          }
          if (
            Number(token?.user_point_history__ts) < earliestDate ||
            earliestDate === 0
          ) {
            earliestDate = Number(token?.user_point_history__ts);
          }
        });

        if (earliestDate && lastDate) {
          //console.log("HERE");

          earliestDate = new Date(earliestDate * 1000);
          console.log(earliestDate, 'EARLIEST DATE for ganttChart');

          lastDate = new Date(lastDate * 1000);
          setWindowStartDate(earliestDate);
          setWindowEndDate(lastDate);
          setNoCols(
            (lastDate.getFullYear() - earliestDate.getFullYear()) * 12 +
              lastDate.getMonth() -
              earliestDate.getMonth() +
              2
          );
        }
        // console.log(earliestDate, "EARLIEST DATE")

        tokens.forEach((token) => {
          finalStakingData['totalStaked'] =
            finalStakingData['totalStaked'] +
            Number(token?.locked.amount) / AIUS_wei;
          finalStakingData['totalGovernancePower'] =
            finalStakingData['totalGovernancePower'] +
            Number(token?.balanceOfNFT) / AIUS_wei;

          if (
            finalStakingData['firstUnlockDate'] == 0 ||
            finalStakingData['firstUnlockDate'] > Number(token?.locked__end)
          ) {
            finalStakingData['firstUnlockDate'] = Number(token?.locked__end);
            console.log(
              finalStakingData['firstUnlockDate'],
              'first unlock Date and current date time',
              new Date().getTime()
            );
            // console.log();
          }
          //console.log({ earliestDate });
          console.log('token locked__end', token.locked.end);

          finalStakingData['allStakes'].push({
            staked: Number(token?.locked.amount) / AIUS_wei,
            endDate: new Date(Number(token?.locked__end) * 1000)
              .toISOString()
              .split('T')[0],

            startDate: new Date(Number(token?.user_point_history__ts) * 1000)
              .toISOString()
              .split('T')[0],
            currentDate: new Date().toLocaleDateString('en-US'),
            governancePower: Number(token?.balanceOfNFT) / AIUS_wei,
            initialBalance: Number(token?.initialBalance) / AIUS_wei,
            veAIUSBalance: veAIUSBalance(
              Number(token?.locked.amount) / AIUS_wei,
              Number(token?.user_point_history__ts),
              Number(token?.locked__end)
            ),

            stake_start: getMonthDifference(
              new Date(Number(token?.user_point_history__ts) * 1000),
              earliestDate
            ),
            staked_till_now:
              getMonthDifference(
                new Date(Number(token?.locked__end) * 1000),
                new Date(Number(token?.user_point_history__ts) * 1000)
              ) > 0
                ? getMonthDifference(
                    new Date(),
                    new Date(Number(token?.user_point_history__ts) * 1000)
                  )
                : 0,
            stake_completion:
              getMonthDifference(
                new Date(Number(token?.locked__end) * 1000),
                new Date()
              ) > 0
                ? getMonthDifference(
                    new Date(Number(token?.locked__end) * 1000),
                    new Date()
                  )
                : 0,
          });

          // console.log(finalStakingData["firstUnlockDate"], "FINAL", new Date().getTime(), "DIFF", finalStakingData["firstUnlockDate"] * 1000 - new Date().getTime())
        });
        if (earliestDate) {
          let earlyDate = finalStakingData['firstUnlockDate'];
          let tempDifferenceValue =
            Math.abs(new Date(earlyDate * 1000) - new Date().getTime()) / 1000;

          finalStakingData['firstUnlockDate'] = parseInt(
            tempDifferenceValue / 86400
          );

          if (finalStakingData['firstUnlockDate'] == 0) {
            if (tempDifferenceValue < 3600) {
              finalStakingData['firstUnlockDateMinutes'] = parseInt(
                tempDifferenceValue / 60
              );
            }
          }
          if (finalStakingData['firstUnlockDateMinutes'] == 0) {
            if (tempDifferenceValue < 86400) {
              finalStakingData['firstUnlockDateHours'] = parseInt(
                tempDifferenceValue / 3600
              );
            }
          }

          // earliestDate = new Date(earliestDate * 1000);
          finalStakingData['stake_start_date'] =
            `${earliestDate.toLocaleString('en-us', { month: 'short', year: 'numeric' }).toString().slice(0, 3)},${earliestDate.getFullYear().toString().slice(-2)}`;
          console.log(finalStakingData['firstUnlockDate'], 'First unlock date');

          mergedTokensData['ganttChart'] = finalStakingData;
          mergedTokensData['slidingCards'] = tokens;
        }
        setTokenIDs(mergedTokensData);
        setLoading(false);
      } catch (e) {
        console.log(e);
        setLoading(false);
      }
    };

    f1();

    if (address) {
      f();
    } else {
      setTokenIDs({
        slidingCards: {},
        ganttChart: {},
      });
    }
  }, [address, chainId, updateValue]);
  /* DASHBOARD CALLS ENDS HERE */

  console.log(tokenIDs, 'TOKENS');

  return (
    <div
      className='mx-auto w-mobile-section-width max-w-center-width py-10 text-black-text lg:py-16 xl:w-section-width'
      id='dashboard'
    >
      <div className='flex items-baseline justify-start gap-3'>
        <h1 className='lato-bold text-[40px] text-purple-text'>
          <span className='hidden um:inline'>veAIUS</span> Dashboard{' '}
        </h1>{' '}
        <Image src={aius_icon} width={'auto'} height={33} alt='' />
      </div>

      <div className='my-10 mt-14 grid-cols-3 gap-10 xl:grid'>
        <div className='col-span-1 h-auto'>
          <div className='stake-box-shadow stake-box-shadow h-full rounded-2xl bg-white-background p-8'>
            <h1 className='text-[20px] font-semibold text-purple-text'>
              Wallet
            </h1>
            <div className='mt-6 grid grid-cols-2 gap-[1vw] xl:mt-8 2xl:gap-[2vw]'>
              <div className='flex flex-col items-start justify-start gap-8'>
                <div>
                  <h2 className='text-[14px] font-semibold text-aius-tabs-gray'>
                    Balance
                  </h2>
                  <h2 className='mt-[2px] text-[16px] font-semibold 2xl:text-[18px]'>
                    {Number(walletBalance / AIUS_wei)?.toFixed(2).toString()}{' '}
                    <span className='text-[11px] font-medium'>AIUS</span>
                  </h2>
                </div>
                <div>
                  <h2 className='text-[14px] font-semibold text-aius-tabs-gray'>
                    {/*Historical LP Profit*/}
                  </h2>
                  <div className='mt-[2px] flex items-center justify-start gap-2'>
                    {/*
                    {' '}
                    <h2 className='text-[16px] font-semibold 2xl:text-[18px]'>
                      0 %
                    </h2>
                    <Image
                      src={gysr_logo_wallet}
                      width={22}
                      height={22}
                      alt=''
                    />
                    */}
                  </div>
                </div>
              </div>
              <div className='flex flex-col items-start justify-start gap-8'>
                <div>
                  <h2 className='text-[14px] font-semibold text-aius-tabs-gray'>
                    Wallet TVL
                  </h2>
                  <h2 className='mt-[2px] text-[16px] font-semibold 2xl:text-[18px]'>
                    ${' '}
                    {protocolData?.data?.AIUS?.quote?.USD?.price
                      ? (
                          protocolData?.data?.AIUS?.quote?.USD?.price *
                          Number(walletBalance / AIUS_wei)
                        )?.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : 0}
                  </h2>
                </div>
                {/*<div>
                  <h2 className='text-[14px] font-semibold text-aius-tabs-gray'>
                    APR
                  </h2>
                  <h2 className='mt-[2px] text-[16px] font-semibold 2xl:text-[18px]'>
                    {totalSupply && rewardRate
                      ? getAPR(rewardRate, totalSupply)?.toLocaleString(
                          'en-US',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )
                      : 0}
                    %
                  </h2>
                </div>*/}
              </div>
            </div>
            <div className="horizontal-section">
              <div className="bg-stake-input text-[#404040] p-[8px_25px] text-center rounded-[10px]">
                APR :  <span className="text-purple-text">{totalSupply && rewardRate
                      ? getAPR(rewardRate, totalSupply)?.toLocaleString(
                          'en-US',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )
                      : 0}
                    %</span>
              </div>
            </div>
          </div>
        </div>
        <div className='col-span-2 mt-10 xl:mt-0'>
          <div className='xl:pl-2'>
            <div className='stake-box-shadow mb-2 w-full rounded-2xl bg-white-background px-8 py-3'>
              <h1 className='text-[20px] font-semibold text-purple-text'>
                My Stakes
              </h1>
            </div>
          </div>
          <div className=''>
            {loading ? (
              <div className='h-[300px] xl:pl-2'>
                <Loader />
              </div>
            ) : tokenIDs?.slidingCards && tokenIDs?.slidingCards.length > 0 ? (
              <SlidingCards
                isLoading={isLoading}
                totalEscrowBalance={escrowBalanceData}
                tokenIDs={tokenIDs?.slidingCards}
                rewardRate={rewardRate}
                totalSupply={totalSupply}
                walletBalance={walletBalance}
                updateValue={updateValue}
                setUpdateValue={setUpdateValue}
              />
            ) : (
              <div className='flex h-[300px] items-center justify-center xl:pl-2'>
                <div className='flex h-full w-full items-center justify-center rounded-2xl bg-white-background'>
                  <h1 className='text-[20px] font-semibold text-purple-text'>
                    No Stakes Found
                  </h1>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className='mt-10 hidden grid-cols-1 gap-10 xl:grid xl:grid-cols-3'>
        <div className='col-span-1 block h-auto'>
          <div className='stake-box-shadow stake-box-shadow h-full rounded-2xl bg-white-background px-2 py-8 um:p-8'>
            <h1 className='text-[20px] font-semibold text-purple-text'>
              Protocol Info
            </h1>
            <div className='mb-10 mt-6 grid grid-cols-2 gap-[1vw] xl:mt-8 2xl:gap-[2vw]'>
              <div className='flex flex-col items-start justify-center gap-8'>
                <div>
                  <h2 className='text-[14px] font-semibold text-aius-tabs-gray'>
                    AIUS Staked
                  </h2>
                  <h2 className='mt-[2px] text-[16px] font-semibold 2xl:text-[18px]'>
                    {veSupply
                      ? (Number(veSupply) / AIUS_wei).toFixed(2)
                      : 0}
                  </h2>
                </div>
                <div>
                  <h2 className='text-[14px] font-semibold text-aius-tabs-gray'>
                    Total Supply
                  </h2>
                  <h2 className='mt-[2px] text-[16px] font-semibold 2xl:text-[18px]'>
                    1,000,000
                    <span className='text-[11px] font-medium'>&nbsp;AIUS</span>
                  </h2>
                </div>
              </div>
              <div className='flex flex-col items-start justify-center gap-8'>
                <div>
                  <h2 className='text-[14px] font-semibold text-aius-tabs-gray'>
                    AIUS Market Cap
                  </h2>
                  <h2 className='mt-[2px] text-[16px] font-semibold 2xl:text-[18px]'>
                    $
                    {new Intl.NumberFormat('en-US', {
                      notation: 'compact',
                      compactDisplay: 'short',
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                    }).format(
                      protocolData?.data?.AIUS?.self_reported_market_cap
                    )}{' '}
                  </h2>
                </div>
                <div>
                  <h2 className='text-[14px] font-semibold text-aius-tabs-gray'>
                    Circulating supply
                  </h2>
                  <h2 className='mt-[2px] text-[16px] font-semibold 2xl:text-[18px]'>
                    {protocolData?.data?.AIUS?.self_reported_circulating_supply.toLocaleString(
                      'en-US',
                      {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }
                    )}{' '}
                    <span className='text-[11px] font-medium'>AIUS</span>
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='col-span-2 hidden h-full pl-2 xl:block'>
          {/* <GanttChart isLoading={loading} allStakingData={tokenIDs?.ganttChart} noCols={noCols} windowStartDate={windowStartDate} windowEndDate={windowEndDate} />  */}
          {
            loading ? (
              <div className='h-[300px]'>
                <Loader />
              </div>
            ) : (
              <Gantt
                allStakingData={
                  tokenIDs?.ganttChart &&
                  tokenIDs?.ganttChart.allStakes &&
                  tokenIDs?.ganttChart.allStakes.length > 0
                    ? tokenIDs?.ganttChart
                    : []
                }
              />
            )
            /*: <div className='h-[300px] flex justify-center items-center'>
                            <div className=' bg-[#fff] rounded-2xl w-full h-full flex justify-center items-center'>
                                <h1 className='text-[#4A28FF] text-[20px] font-semibold'>No Stakes Found</h1>
                            </div>
                        </div>*/
          }
        </div>
      </div>
    </div>
  );
}

export default DashBoard;
