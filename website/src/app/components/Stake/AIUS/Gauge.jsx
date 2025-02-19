import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import polygon from '../../../assets/images/polygon.png';
import info_icon from '../../../assets/images/info_icon.png';
import mistral_icon from '../../../assets/images/mistral_icon.png';
import nemotron_icon from '../../../assets/images/nemotron_icon.png';
import deepseek_icon from '../../../assets/images/deepseek_icon.png';
import llama_icon from '../../../assets/images/llama.png';
import search_icon from '../../../assets/images/search_icon.png';
import PopUp from './PopUp';
import cross_icon from '../../../assets/images/cross_icon.png';
import arbius_logo_without_name from '@/app/assets/images/arbius_logo_without_name.png';
import clock_icon from '../../../assets/images/clock_icon.png';
import skeleton from '../../../assets/images/skeleton.png';
import prompts from '../../../assets/images/prompts.png';
import github from '../../../assets/images/github.png';
import thunder from '../../../assets/images/thunder.png';
import governance from '../../../assets/images/governance.png';
import info_red from '../../../assets/images/info_red.png';
import lightning from '../../../assets/images/lightning.svg';
import lightningbulb from '../../../assets/images/lightningbulb.svg';
import confirmvote from '../../../assets/images/confirmvote.svg';
import votingEscrow from '../../../abis/votingEscrow.json';
import voter from '../../../abis/voter.json';
import engineABI from '../../../abis/v2_enginev4.json';
import Web3 from 'web3';
import Config from '@/config.one.json';
import { getTokenIDs } from '../../../Utils/gantChart/contractInteractions';
import { useAccount, useNetwork } from 'wagmi';
import Timer from './Timer';
import { AIUS_wei, infuraUrl, alchemyUrl } from '../../../Utils/constantValues';
import CircularProgressBar from './CircularProgressBar';
import powered_by from '../../../assets/images/powered_by.png';
import cross from '../../../assets/images/cross.png';
import error_stake from '../../../assets/images/error_stake.png';
import success_stake from '../../../assets/images/success_stake.png';
import { getTransactionReceiptData } from '../../../Utils/getTransactionReceiptData';

function Gauge({
  updateValue,
  setUpdateValue,
}) {
  const { address, isConnected } = useAccount();
  const { chain, chains } = useNetwork();
  const [totalGovernancePower, setTotalGovernancePower] = useState(0);
  const [allTokens, setAllTokens] = useState([]);

  const data = [
    {
      model_name: 'Mistral-large-2407',
      model_id: '0x9d04df3076afee4ab86ac2e30f103ecc9dd5bea9cb70af6881d74f638183e274',
      description: 'Text Generator',
      emissions: '0%',
      fees: '0',
      prompts: '40,304',
      icon: mistral_icon,
      model_bytes: "0x9d04df3076afee4ab86ac2e30f103ecc9dd5bea9cb70af6881d74f638183e274"
    },
    {
      model_name: 'Nemotron-4-340b',
      model_id: '0xba6e50e1a4bfe06c48e38800c4133d25f40f0aeb4983d953fc9369fde40ef87b',
      description: 'Text Generator',
      emissions: '0%',
      fees: '0',
      prompts: '38,994',
      icon: nemotron_icon,
      model_bytes: "0xba6e50e1a4bfe06c48e38800c4133d25f40f0aeb4983d953fc9369fde40ef87b"
    },
    {
      model_name: 'Llama-3.1-405b',
      model_id: '0x6c7442f4cf999d9cb907458701b6c0dc2bb9eff10bfe20add82a9917ea955a64',
      description: 'Text Generator',
      emissions: '0%',
      fees: '0',
      prompts: '32,945',
      icon: llama_icon,
      model_bytes: "0x6c7442f4cf999d9cb907458701b6c0dc2bb9eff10bfe20add82a9917ea955a64"
    },
    {
      model_name: 'Llama-3.1-80b',
      model_id: '0xe6a0efde928efd1b948521b7517888363c4d5d5f1272dd6ba3170726a722afd1',
      description: 'Text Generator',
      emissions: '0%',
      fees: '0',
      prompts: '10,203',
      icon: llama_icon,
      model_bytes: "0xe6a0efde928efd1b948521b7517888363c4d5d5f1272dd6ba3170726a722afd1"
    },
    {
      model_name: 'Deepseek-coder-v2',
      model_id: '0x83da7b4bbec9da6b1664342bae2db3c920d43e4aebe92f9d0e8e5d80492ad68c',
      description: 'Code Generator',
      emissions: '0%',
      fees: '0',
      prompts: '6049',
      icon: deepseek_icon,
      model_bytes: "0x83da7b4bbec9da6b1664342bae2db3c920d43e4aebe92f9d0e8e5d80492ad68c"
    },
  ];

  const [showPopUp, setShowPopUp] = useState(false);
  const [filteredData, setFilteredData] = useState(data);
  const [searchText, setSearchText] = useState('');
  const [showConfirmVote, setShowConfirmVote] = useState(false)
  const [votingPercentage, setVotingPercentage] = useState({});
  const [percentageLeft, setPercentageLeft] = useState(100);
  const [percentUsed, setPercentageUsed] = useState(0);
  const [epochTimestamp, setEpochTimestamp] = useState(0);
  const [lastUserVote, setLastUserVote] = useState(0);
  const [newTokenIDs, setNewTokensIDs] = useState([]);
  const [newGovernancePower, setNewGovernancePower] = useState(0);

  const handleSearch = (e) => {
    console.log(e.target.value);
    setSearchText(e.target.value);
    // debounce the function call
    let time = setTimeout(() => {
      setFilteredData(
        data.filter((item) =>
          item.model_name.toLowerCase().includes(e.target.value.toLowerCase())
        )
      );
      clearTimeout(time);
    }, 300);
  };

  const updateModelPercentage = (modelName, modelBytes, percentage) => {
    percentage = Number(percentage)

    if(typeof percentage === 'number' && percentage >= 0 && Number.isInteger(percentage)){

      let sum = 0;
      let error_key = false;

      for (const [key, value] of Object.entries(votingPercentage)) {
        if(key !== modelName){
          sum = sum + Number(value?.percentage)
        }

        if(value?.error){
          error_key = key
        }
      }
      // Case where an error has already added but not been corrected yet; so until that is corrected, no other model's percentage will be accepted
      if(error_key && error_key !== modelName){
        return;
      }
      // Case where an error has already added but not been corrected yet; so until that is corrected, no other model's percentage will be accepted

      const _sum = sum;
      sum = sum + percentage;
      if( sum > 100 ){
        if(!newGovernancePower){
          setVotingPercentage((prevState) => ({
            ...prevState,
            [modelName]: {
              "percentage": percentage,
              "error": "You only have "+ Math.min(100, Math.abs(100 - _sum)) +"% left"
            },
          }));
        }

        if(newGovernancePower){
          let percentageUsed = ((totalGovernancePower - newGovernancePower)/totalGovernancePower) * 100;
          let inputPercentageInValue = (_sum / 100) * newGovernancePower;
          let percentageOfInput = (inputPercentageInValue / totalGovernancePower) * 100

          setPercentageLeft(Math.min(100, Math.abs(100 - percentageUsed - percentageOfInput)).toFixed(0))

          setVotingPercentage((prevState) => ({
            ...prevState,
            [modelName]: {
              "percentage": percentage,
              "error": "You only have "+ Math.min(100, Math.abs(100 - percentageUsed - percentageOfInput)).toFixed(0) +"% left"
            },
          }));
        }else{
          setPercentageLeft(Math.min(100, Math.abs(100 - _sum)))
        }
        return;
      }
      if(newGovernancePower){
        let percentageUsed = ((totalGovernancePower - newGovernancePower)/totalGovernancePower) * 100;
        let inputPercentageInValue = (sum / 100) * newGovernancePower;
        let percentageOfInput = (inputPercentageInValue / totalGovernancePower) * 100

        setPercentageLeft(Math.min(100, Math.abs(100 - percentageUsed - percentageOfInput)).toFixed(0))
      }else{
        setPercentageLeft(Math.min(100, Math.abs(100 - sum)))
      }

      setVotingPercentage((prevState) => ({
        ...prevState,
        [modelName]: {
          "percentage": percentage,
          "model_bytes": modelBytes,
          "error": false
        },
      }));
    }
  };

  const calculateNewPercentageLeft = (newGovPower) => {
    const _percentage = ((totalGovernancePower - newGovPower)/totalGovernancePower) * 100
    setPercentageLeft((100 - _percentage).toFixed(0));
    setPercentageUsed(_percentage.toFixed(0));
  }

  const getTimestamp7DaysEarlier = (timestamp) => {
    const date = new Date(timestamp);
    const sevenDaysEarlier = date.getTime() - 7 * 24 * 60 * 60 * 1000;
    return sevenDaysEarlier / 1000;
  };

  useEffect(() => {

    if(Number(lastUserVote) > 0){

      let newGovPower = 0;
      let _newTokenIDs = [];
      // proceed with calculations and setting up things
      if(Number(lastUserVote) > getTimestamp7DaysEarlier(epochTimestamp)){ // check if last user vote was this week or last week
        for(let i=0; i<allTokens.length; i++){
          if(Number(allTokens[i]?.stakedOn) > lastUserVote){ // check for a new stake
            if( (Number(allTokens[i].locked__end) * 1000) > Date.now()){
              newGovPower = newGovPower + Number(allTokens[i]?.balanceOfNFT)
              _newTokenIDs.push(allTokens[i]?.tokenID)
            }
          }
        }
      }
      setNewGovernancePower(newGovPower);
      setNewTokensIDs(_newTokenIDs);

      if(Number(lastUserVote) > getTimestamp7DaysEarlier(epochTimestamp)){
        calculateNewPercentageLeft(newGovPower);
      }
    }
  },[lastUserVote, updateValue, totalGovernancePower])


  const getWeb3 = async() => {
    return await fetch(infuraUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_blockNumber",
          params: []
        }),
      })
      .then(res => res.json())
        .then(data => {
          if (data.error) {
            console.error("Infura error:", data.error.message);
            let web3 = new Web3(new Web3.providers.HttpProvider(alchemyUrl));
            return web3
          } else {
            let web3 = new Web3(new Web3.providers.HttpProvider(infuraUrl));
            console.log("Successfully connected. Block number:", data.result);
            return web3
          }
        })
        .catch((err) => {
          console.log("Request failed:", err)
          let web3 = new Web3(new Web3.providers.HttpProvider(alchemyUrl));
          return web3
        });
  }


  useEffect(() => {

    const initialModelPercentages = data.reduce((accumulator, item) => {
      accumulator[item.model_name] = {
        "percentage": 0,
        "error": null
      };
      return accumulator;
    }, {});
    setVotingPercentage(initialModelPercentages);

    const f1 = async () => {
      try{
        const web3 = await getWeb3()

        const voterContract = new web3.eth.Contract(
          voter.abi,
          Config.v4_voterAddress
        );
        const engineContract = new web3.eth.Contract(
          engineABI.abi,
          Config.v4_engineAddress
        );

        const _epochVoteEnd = await voterContract.methods.epochVoteEnd().call();
        setEpochTimestamp(_epochVoteEnd * 1000)

        const _modelData = JSON.parse(JSON.stringify(data));

        for(let i=0; i<_modelData.length; i++){
          let a = await voterContract.methods.getGaugeMultiplier(_modelData[i]?.model_id).call()
          _modelData[i]["emissions"] = ((Number(a) / AIUS_wei) * 100).toFixed(1).toString()+"%";

          let b = await engineContract.methods.models(_modelData[i]?.model_bytes).call()
          _modelData[i]["fees"] = (Number(b.fee) / AIUS_wei).toFixed(10).toString();
        }
        setFilteredData(_modelData)

        console.log(engineContract, "EC")

      }catch(e){
        console.log("F1 error", e)
      }
    }


    const f = async () => {
      try{
        const web3 = new Web3(window.ethereum);
        
        const votingEscrowContract = new web3.eth.Contract(
          votingEscrow.abi,
          Config.v4_votingEscrowAddress
        );
        const voterContract = new web3.eth.Contract(
          voter.abi,
          Config.v4_voterAddress
        );
        const _epochVoteEnd = await voterContract.methods.epochVoteEnd().call();
        setEpochTimestamp(_epochVoteEnd * 1000)
        
        const _escrowBalanceData = await votingEscrowContract.methods
          .balanceOf(address)
          .call();

        let tokens = await getTokenIDs(address, _escrowBalanceData);
        setAllTokens(tokens);

        let _totalGovernancePower = 0;
        let _lastVoted = 0;

        for (const token of tokens) {
          if ((Number(token?.locked__end) * 1000) > Date.now()) {
            _totalGovernancePower = _totalGovernancePower + Number(token?.balanceOfNFT);
          }

          const lastVoted = await voterContract.methods.lastVoted(token?.tokenID).call();
          if (lastVoted > 0) {
            _lastVoted = lastVoted;
          }
        }

        setLastUserVote(_lastVoted);
        setTotalGovernancePower(_totalGovernancePower)
      }catch(err){
        console.log("Error at gauge fetch:", err)
      }
    }

    f1();

    if (address) {
      f();
    } else {
    }
  }, [address, chain?.id, updateValue]);

  const getGPUsed = () => {
    let _totalGovernancePower = totalGovernancePower;
    const percentageUsed = 100 - percentageLeft;

    if( (((percentageUsed/100) * _totalGovernancePower) / AIUS_wei) < 1){
      let res = Number((((percentageUsed/100) * _totalGovernancePower) / AIUS_wei)?.toFixed(2))
      return res.toFixed(2)
    }else{
      let res = Number((((percentageUsed/100) * _totalGovernancePower) / AIUS_wei)?.toFixed(0))
      return res.toFixed(0)
    }
  }

  const getGovPowerFormatted = () => {
    let _totalGovernancePower = totalGovernancePower;

    // if(newGovernancePower > 0){
    //   _totalGovernancePower = newGovernancePower;
    // }

    if( (Number(_totalGovernancePower) / AIUS_wei) < 1 ){
      return (Number(_totalGovernancePower) / AIUS_wei)?.toFixed(2)
    }else{
      return (Number(_totalGovernancePower) / AIUS_wei)?.toFixed(0)
    }
  }

  const handleVoting = async() => {
    try{
      setShowPopUp("2")
      let allTokenIDs = []
      for(let i=0; i<allTokens.length; i++){
        if( (Number(allTokens[i].locked__end) * 1000) > Date.now()){
          allTokenIDs.push(allTokens[i].tokenID)
        }
      }
      if(newTokenIDs.length > 0){
        allTokenIDs = newTokenIDs;
      }

      let models = [];
      let weights = [];

      Object.entries(votingPercentage).map(([key, value], index) => {
        if(value?.percentage > 0){
          models.push(value?.model_bytes)
          weights.push(value?.percentage)
        }
      })

      const modelArrays = Array(allTokenIDs.length).fill().map(() => [...models])
      const weightArrays = Array(allTokenIDs.length).fill().map(() => [...weights])

      const web3 = new Web3(window.ethereum);
      const voterContract = new web3.eth.Contract(
        voter.abi,
        Config.v4_voterAddress
      );
      console.log(allTokenIDs, modelArrays, weightArrays)

      await voterContract.methods.voteMultiple(
        allTokenIDs,
        modelArrays,
        weightArrays
      ).send({from: address})
      .then((receipt) => {
        setShowPopUp('Success');
        setShowConfirmVote(false)
        const initialModelPercentages = data.reduce((accumulator, item) => {
          accumulator[item.model_name] = {
            "percentage": 0,
            "error": null
          };
          return accumulator;
        }, {});
        setVotingPercentage(initialModelPercentages);
        setPercentageLeft(0);
        setUpdateValue((prevValue) => prevValue + 1);
      })
      .catch((error) => {
        console.log(error)
        setShowConfirmVote(false)
        setShowPopUp('Error');
        const initialModelPercentages = data.reduce((accumulator, item) => {
          accumulator[item.model_name] = {
            "percentage": 0,
            "error": null
          };
          return accumulator;
        }, {});
        setVotingPercentage(initialModelPercentages);
        setPercentageLeft(100);
      })
    }catch(err){
      console.log(err)
      setShowConfirmVote(false)
      setShowPopUp('Error');
      const initialModelPercentages = data.reduce((accumulator, item) => {
        accumulator[item.model_name] = {
          "percentage": 0,
          "error": null
        };
        return accumulator;
      }, {});
      setVotingPercentage(initialModelPercentages);
      setPercentageLeft(100);
    }
  }

  const handleFocus = (e) => {
    if (e.target.value === "0") {
      e.target.value = ""; // Clear the input if the value is "0"
    }
  };

  const handleBlur = (e) => {
    if (e.target.value === "") {
      e.target.value = "0"; // Reset to "0" if the input is empty
    }
  };

  const checkIfUserCanVote = () => {
    if(Number(lastUserVote) > 0 && Number(lastUserVote) > getTimestamp7DaysEarlier(epochTimestamp)){ // CHECK IF USER HAD A VOTE PREVIOUSLY + IF THE LAST VOTE WAS FROM CURRENT WEEK OR PREVIOUS WEEKS
      if(newGovernancePower > 0){
        return true;
      }else{
        return false;
      }
    }else{
      return true;
    }
  }

  const userCanVote = () => {
    // CHECK IF USER HAS INPUTTED A TOTAL OF 100
    let sum_percentage = 0;
    Object.entries(votingPercentage).map(([key, value], index) => {
        if(value?.percentage > 0){
          sum_percentage = sum_percentage + Number(value.percentage);
        }
    })
    if(sum_percentage !== 100){
      return;
    }
    // CHECK IF USER HAS INPUTTED A TOTAL OF 100

    return checkIfUserCanVote();
  }

  return (
    <div className='mx-auto w-mobile-section-width max-w-center-width py-10 text-black-text lg:w-section-width lg:py-16'>
      {showPopUp !== false && (
        <>
          <PopUp setShowPopUp={setShowPopUp}>
            {showPopUp === 'Success' && (
              <SuccessChildren setShowPopUp={setShowPopUp} />
            )}
            {showPopUp === 'Error' && (
              <ErrorPopUpChildren setShowPopUp={setShowPopUp} />
            )}
            {showPopUp === '2' && (
              <StepTwoChildren
                setShowPopUp={setShowPopUp}
                isError={false}
                noChildren={true}
                repeat={false}
              />
            )}
          </PopUp>
        </>
      )}
      {
        showConfirmVote ?
          <div className="absolute top-0 left-0 w-[100vw] h-[100vh] bg-[#FFFFFFCC] z-[10]">
            <div className="w-[750px] mt-[10%] mx-auto bg-white-background p-4 shadow-[0px_0px_50px_10px_#2A0FB933] rounded-[15px]">
              <div className="relative">
                <Image onClick={() => setShowConfirmVote(false)} className="cursor-pointer absolute right-0" src={cross_icon} alt="" />
              </div>
              <div className="flex text-center flex-col items-center font-Geist-Regular px-2 py-4 gap-4">
                <Image className="h-[45px] w-[45px]" src={confirmvote} alt="" />
                <div className="text-[32px] lato-regular">Confirm Vote</div>
                <div className="text-aius-tabs-gray mx-[5%] lato-light">
                  By confirming this transaction, all user owned governance power will be consumed during the duration of this voting period. In the circumstance a new stake is added after voting during this period, you may cast an additional vote with the newly added balance. All votes are final.
                </div>
                <div className="flex flex-wrap justify-center mt-4">
                  {
                    filteredData?.map((item, key) => {
                      return <div className={`whitespace-nowrap flex items-center gap-2 bg-[#FAF6FF] p-2 rounded-[10px] mb-2 mr-2 ${votingPercentage?.[item?.model_name].percentage > 0 ? "" : "hidden"} `} key={key}>
                        <div className='flex h-[28px] w-[28px] items-center justify-center rounded-full bg-purple-background'>
                          <div className='relative flex h-[16px] w-[16px] items-center justify-center'>
                            <Image
                              src={item?.icon}
                              fill
                              className='h-full w-full object-contain'
                            />
                          </div>
                        </div>
                        <h1 className='text-[0.85rem] 2xl:text-base'>
                          {item?.model_name} - {votingPercentage?.[item?.model_name].percentage}%
                        </h1>
                      </div>
                    })
                  }
                </div>
                <div>
                  <div className="flex gap-2 mt-[20px]">
                    <div onClick={() => setShowConfirmVote(false)} className="cursor-pointer px-[40px] py-[8px] text-aius-tabs-gray bg-[#E8E8E8] rounded-[25px]">Cancel</div>
                    <div onClick={handleVoting} className="hover:bg-buy-hover px-[40px] py-[8px] text-[#FFF] bg-[#000000] rounded-[25px] cursor-pointer">Confirm</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        : null
      }

      <div className='w-full items-center justify-between lg:flex'>
        <div className='flex flex-col xl:flex-row h-auto w-full xl:items-center justify-start mb-3 xl:mb-0 xl:gap-4'>
          <h1 className='lato-bold mb-2 text-[40px] text-purple-text'>Gauge</h1>
          <div className='flex items-center xl:justify-end gap-1 md:gap-2 text-end text-[14px] font-semibold text-purple-text'>
            <Image src={clock_icon} className='h-3 w-3 md:h-4 md:w-4' />

            <div className='flex items-center justify-start gap-2'>
              <h1 className='text-[11px] xl:text-[12px] 2xl:text-[16px]'>Voting ends in <Timer epochTimestamp={epochTimestamp} /></h1>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 xl:items-center relative flex-col-reverse xl:flex-row">
        <div className='stake-box-shadow flex h-auto items-center justify-between rounded-md bg-white-background px-2 pr-3'>
          <input
            placeholder='Search Model name or ID'
            className='h-full w-[250px] border-0 bg-transparent p-2 px-3 py-3 focus:outline-none placeholder-[#B0B0B0]'
            value={searchText}
            onChange={(e) => {
              handleSearch(e);
            }}
          />
          <Image src={search_icon} className='h-4 w-4' />
        </div>
        <div className="flex gap-2 text-purple-text border-[1px] border-purple-text p-1 rounded-[10px]">
          <div className="flex items-center gap-1 md:gap-2 p-2 bg-white-background rounded-md basis-[50%] xl:basis-[unset] text-[11px] md:text-[16px]">
            <Image src={lightning} className="h-[11px] md:h-[15px] w-auto mt-[2px]" alt="" /> Total Governance Power: { getGovPowerFormatted() }
          </div>
          <div className="flex flex-col gap-1 p-2 bg-white-background rounded-md basis-[50%] xl:basis-[unset]">
            <div className="flex justify-between text-[11px] md:text-[12px]">
              <div>{percentUsed == 100 ? getGovPowerFormatted() : getGPUsed()}/{ getGovPowerFormatted() }</div>
              <div>{percentageLeft}% left</div>
            </div>
            <div className="w-full xl:w-[234px] bg-gray-text rounded-full h-2">
              <div className="bg-purple-background h-2 rounded-full" style={{width: (100 - percentageLeft).toString()+"%" }}></div>
              <div className={`bg-[#9f76ff] h-2 ${ percentUsed == 100 ? "rounded-full" : "rounded-l-full"} relative top-[-8px] z-2`} style={{width: percentUsed.toString()+"%" }}></div>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-[-55px] xl:top-[unset]">

          <div onClick={Number(percentageLeft) === 0 && userCanVote() ? ()=>setShowConfirmVote(true) : null} className={`${ Number(percentageLeft) === 0 && userCanVote() ? "bg-black-background text-original-white hover:bg-buy-hover" : "bg-[#E8E8E8] text-aius-tabs-gray" } p-[8px_40px] rounded-[25px] cursor-pointer group xl:block`}>
            Vote
            <div className="absolute left-[-10px] top-[-130px] bg-white-background p-2 rounded-[15px] w-[130px] opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all duration-300">
              <Image src={lightningbulb} alt="" />
              <div className="text-[12px] text-aius-tabs-gray">
                {
                  checkIfUserCanVote() ?
                    "100% of user owned governance power must be contributed before proceeding."
                  : "You have already voted, create a new stake to vote again with your new balance."
                }
              </div>
              <div className="absolute left-[62px] bottom-[-5px] w-0 h-0 border-l-[5px] border-l-transparent border-b-[8px] border-[#FFF] border-r-[5px] border-r-transparent rotate-[60deg]"></div>
            </div>
          </div>
        </div>
      </div>
      <div className='w-full overflow-x-auto xl:overflow-x-visible'>
        <div className='text-[13px] md:text-[16px] gauge-table-headings mb-4 mt-2 flex min-w-[700px] md:min-w-[1000px] items-center justify-between gap-2 md:gap-8 rounded-lg bg-white-background px-5 pb-2 pt-2 font-semibold lg:px-10 lg:pb-6 lg:pt-6'>
          <div className='w-[25%]'>
            <h1>Model Name</h1>
          </div>
          <div className='w-[15%]'>
            <h1>Description</h1>
          </div>
          <div className='w-[12.5%]'>
            <h1>Emissions</h1>
          </div>
          <div className='w-[20%]'>
            <h1 className="flex items-center">Fees <span className="text-[13px]">(AIUS)</span>
              <div className="group relative">
                <Image src={info_icon} className='cursor-pointer ml-1 w-[12px] h-[12px] grayscale-[1] opacity-30' />
                <div className="hidden group-hover:flex absolute left-[20px] top-[-12px] bg-white-background p-2 rounded-[15px] text-[12px] lato-regular border-[1px] border-light-purple-background">AIUS Cost per Inference</div>
              </div>
            </h1>
          </div>
          <div className='w-[12.5%]'>
            <h1>Repository</h1>
          </div>
          <div className='hidden xl:block w-[15%]'></div>
        </div>

        {filteredData?.map((item, key) => {
          return (
            <div
              className={`gauge-table-item relative my-3 flex min-w-[700px] md:min-w-[1000px] items-center justify-between gap-2 md:gap-8 rounded-lg ${ votingPercentage?.[item?.model_name]?.error === false && votingPercentage?.[item?.model_name]?.percentage > 0 ? "bg-[#ECF7FF]" : "bg-white-background"} px-5 py-5 font-semibold lg:px-10`}
              key={key}
            >
              <div
                className='absolute left-[-125px] top-[10%] z-20 flex hidden items-center justify-start'
                id={key}
              >
                <div className='w-[108px] w-auto rounded-xl bg-white-background p-3'>
                  <h1 className='mb-1 text-[.6rem] text-aius-tabs-gray'>
                    Model ID
                  </h1>
                  <p className='text-[.6rem]'>{item?.model_id.slice(0, 6)}...{item?.model_id.slice(-4)}</p>
                </div>
                <Image src={polygon} className='-ml-2' />
              </div>
              <div className='flex w-[25%] items-center justify-start gap-2'>
                <div className='hidden md:flex h-[20px] w-[20px] md:h-[28px] md:w-[28px] items-center justify-center rounded-full bg-purple-background'>
                  <div className='relative flex h-[16px] w-[16px] items-center justify-center'>
                    <Image
                      src={item?.icon}
                      fill
                      className='h-full w-full object-contain'
                    />
                  </div>
                </div>
                <h1 className='text-[12px] md:text-[0.85rem] 2xl:text-base'>
                  {item?.model_name}
                </h1>
                <div
                  className='mt-[1px] cursor-pointer opacity-30 grayscale-[1] hover:opacity-100 hover:grayscale-0'
                  onMouseOver={() => {
                    document.getElementById(key).style.display = 'flex';
                  }}
                  onMouseLeave={() => {
                    document.getElementById(key).style.display = 'none';
                  }}
                >
                  <Image src={info_icon} height={12} width={12} />
                </div>
              </div>
              <div className='w-[15%]'>
                <h1 className='text-[12px] md:text-[0.85rem] 2xl:text-base'>
                  {item?.description}
                </h1>
              </div>
              <div className='w-[12.5%]'>
                {/*<Image
                  src={skeleton}
                  className='h-[24px] w-[100%] rounded-lg'
                />*/}
                <h1 className='text-[14px] md:text-[0.85rem]'>{item?.emissions}</h1>
              </div>
              <div className='w-[20%]'>
                {/*<Image
                  src={skeleton}
                  className='h-[24px] w-[100%] rounded-lg'
                />*/}
                <h1 className='text-[14px] md:text-[0.85rem]'>{item?.fees} <span className="text-[11px]">($0.0)</span></h1>
              </div>
              <div className='w-[12.5%]'>
                {/*<Image
                  src={skeleton}
                  className='h-[24px] w-[100%] rounded-lg'
                />*/}
                <h1 className="image-blue-filter text-[14px] md:text-[16px] flex items-center gap-1 border-b-[1px] border-[#000] w-fit cursor-pointer hover:text-blue-text hover:border-blue-text">
                  <Image className="mt-[2px] h-[15px] w-[15px] brightness-0" src={github} alt="" /><div>Github</div>
                </h1>
              </div>
              <div className='hidden xl:flex flex-col justify-end w-[15%]'>
                <div className={`flex border-[1px] ${ votingPercentage?.[item?.model_name]?.error ? "border-[#C71518]" : "border-purple-text/20"} rounded-[25px]`}>
                  <div className="rounded-l-[20px] p-[6px_10px] bg-purple-text/10">%</div>
                  <input
                    className={"w-full rounded-r-[25px] bg-white-background w-[70px] focus:outline-none pl-2"}
                    value={votingPercentage?.[item?.model_name]?.percentage}
                    onChange={(e) => updateModelPercentage(item?.model_name, item?.model_bytes, e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
                { votingPercentage?.[item?.model_name]?.error ?
                  <div className="absolute bottom-[2px] text-[#C71518] text-[9px]">{ votingPercentage?.[item?.model_name]?.error }*</div>
                : <div className="absolute bottom-[2px] text-[#FFF] text-[9px]">*</div> }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Gauge;


const StepTwoChildren = ({
  setShowPopUp,
  isError,
  noChildren,
  repeat = true,
}) => {
  return (
    <div>
      <div className='mt-4 flex justify-end'>
        <button className='cursor-pointer' onClick={() => setShowPopUp(false)}>
          <Image src={cross} className='w-[10px]' alt='cross' />
        </button>
      </div>
      <div className='my-12'>
        <div className='flex items-center justify-center'>
          <div className='h-40 w-40'>
            <CircularProgressBar
              valueStart={0}
              valueEnd={100}
              duration={4}
              text={'2/2'}
              setShowPopUp={setShowPopUp}
              step={2}
              isError={isError}
              noChildren={noChildren}
              repeat={true}
            />
          </div>
        </div>
        <h1 className='mt-4 text-center text-[20px] text-original-black'>
          Pending transaction confirmation!
        </h1>
        <h1 className='text-center text-[12px] text-aius-tabs-gray'>
          Confirm this transaction in your wallet.
        </h1>
      </div>

      <div className='flex items-center justify-center'>
        <Image src={powered_by} className='h-4 w-auto' alt='powered_by' />
      </div>
    </div>
  );
};

const SuccessChildren = ({ setShowPopUp }) => {
  return (
    <div>
      <div className='mt-4 flex justify-end'>
        <button className='cursor-pointer' onClick={() => setShowPopUp(false)}>
          <Image src={cross} className='w-[10px]' alt='cross' />
        </button>
      </div>
      <div className='my-12'>
        <div className='flex items-center justify-center'>
          <div className='relative flex h-40 w-40 items-center justify-center rounded-full bg-white-background'>
            <Image src={success_stake} className='w-12' alt='error_stake' />
          </div>
        </div>

        <h1 className='mt-4 text-center text-[20px] text-original-black'>
          Congrats!
        </h1>
        <h1 className='text-center text-[12px] text-aius-tabs-gray'>
          Transaction Completed.
        </h1>
      </div>

      <div className='flex items-center justify-center'>
        <Image src={powered_by} className='h-4 w-auto' alt='powered_by' />
      </div>
    </div>
  );
};

const ErrorPopUpChildren = ({ setShowPopUp }) => {
  return (
    <div>
      <div className='mt-4 flex justify-end'>
        <button className='cursor-pointer' onClick={() => setShowPopUp(false)}>
          <Image src={cross} className='w-[10px]' alt='cross' />
        </button>
      </div>
      <div className='my-12'>
        <div className='flex items-center justify-center'>
          <div className='relative flex h-40 w-40 items-center justify-center rounded-full bg-white-background'>
            <Image src={error_stake} className='w-40' alt='error_stake' />
          </div>
        </div>
        <h1 className='mt-4 text-center text-[20px] text-original-black'>
          Error!
        </h1>
        <h1 className='text-center text-[12px] text-aius-tabs-gray'>
          Please try again.
        </h1>

        <div className='flex items-center justify-center'>
          <button
            onClick={() => setShowPopUp(false)}
            type='button'
            className='group relative mt-2 flex items-center justify-center gap-3 rounded-full bg-black-background px-6 py-1 py-2 lg:px-10'
          >
            <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-4 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
            <div className='lato-bold relative z-10 text-original-white lg:text-[15px]'>
              Continue
            </div>
          </button>
        </div>
      </div>

      <div className='flex items-center justify-center'>
        <Image src={powered_by} className='h-4 w-auto' alt='powered_by' />
      </div>
    </div>
  );
};
