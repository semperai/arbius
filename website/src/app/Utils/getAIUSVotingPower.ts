import { t_max } from './constantValues';

function calculateSecondsUntilRoundedDate(duration: number) {
    const now = new Date();

    // Get current UTC time
    const nowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 
                                     now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));

    // Extract months and weeks from the duration
    const months = Math.floor(duration);
    const weeks = (duration - months) * 4; // Convert fractional months into weeks (approximately)

    // Add months
    let targetDate = new Date(nowUTC);
    targetDate.setUTCMonth(targetDate.getUTCMonth() + months);

    // Add weeks
    targetDate.setUTCDate(targetDate.getUTCDate() + Math.round(weeks * 7));

    // Round down to the nearest previous Thursday
    while (targetDate.getUTCDay() !== 4) { // 4 is Thursday
        targetDate.setUTCDate(targetDate.getUTCDate() - 1);
    }

    // Set target date time to 00:00:00 UTC
    targetDate = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()));

    // Calculate the difference in seconds
    const diffInMilliseconds = targetDate.getTime() - nowUTC.getTime();
    const diffInSeconds = Math.floor(diffInMilliseconds / 1000); // Convert milliseconds to seconds

    return {
        currentTimeUTC: nowUTC.toISOString(),
        targetDateUTC: targetDate.toISOString(),
        secondsUntilRoundedDate: diffInSeconds
    };
}

export const getAIUSVotingPower = (lockedAIUS: number, value: number) => {
  if(!lockedAIUS || !value){
    return 0.00
  }

  // Example usage
  const result = calculateSecondsUntilRoundedDate(value);
  console.log("Current time (UTC):", result.currentTimeUTC);
  console.log("Rounded target date (UTC):", result.targetDateUTC);
  console.log("Seconds until rounded date:", result.secondsUntilRoundedDate);

  const timeToLock = result.secondsUntilRoundedDate;
  const votingPower = (lockedAIUS * timeToLock) / t_max;
  console.log(votingPower, "VP")
  return votingPower;
};
