export const getAIUSVotingPower =  (lockedAIUS, value) => {
        // console.log(lockedAIUS, timeToLock);
        let timeToLock = value * 2419200;  // value in months(decimal) * 4*7*24*60*60
        
        const t_max = 62899200 ; // 104 weeks into seconds
        let votingPower = lockedAIUS * timeToLock/t_max;
        return votingPower;

};