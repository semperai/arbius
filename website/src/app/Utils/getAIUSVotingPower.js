export const getAIUSVotingPower =  (lockedAIUS, timeToLock) => {
        console.log(lockedAIUS, timeToLock);
        const t_max = 104;
        let votingPower = lockedAIUS * timeToLock/t_max;
        return votingPower;

};