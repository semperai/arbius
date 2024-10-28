export const  calculateBonusMultiplier=(timeStaked, totalStakedTokens, bonusPeriod = 90, maxBonusMultiplier = 3) =>{
    // Calculate the bonus multiplier
    let M = 1 + ((timeStaked / bonusPeriod) * (maxBonusMultiplier - 1));
    
    // Calculate the total multiplier
    let totalMultiplier = M * totalStakedTokens;
    
    // Return the results as an object
    return {
        bonusMultiplier: M,
        totalMultiplier: totalMultiplier
    };
}