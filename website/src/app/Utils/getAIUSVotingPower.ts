import { t_max } from './constantValues';

function calculateDate(duration: number) {
    const today = new Date();

    // Extract months and weeks from the duration
    const months = Math.floor(duration);
    const weeks = (duration - months) * 4; // Convert fractional months into weeks (approximately)

    // Add months
    let targetDate = new Date(today);
    targetDate.setMonth(targetDate.getMonth() + months);

    // Add weeks
    targetDate.setDate(targetDate.getDate() + Math.round(weeks * 7));

    // Round down to the nearest previous Thursday
    while (targetDate.getDay() !== 4) { // 4 is Thursday
        targetDate.setDate(targetDate.getDate() - 1);
    }
    // Set time to 00:00:00
    targetDate.setHours(0, 0, 0, 0);

    // Calculate the difference in seconds
    const now = new Date();
    const diffInMilliseconds = targetDate.getTime() - now.getTime();
    const diffInSeconds = Math.floor(diffInMilliseconds / 1000); // Convert milliseconds to seconds

    return diffInSeconds;
}


export const getAIUSVotingPower = (lockedAIUS: number, value: number) => {
  if(!lockedAIUS || !value){
    return 0.00
  }

  const timeToLock = calculateDate(value);
  const votingPower = (lockedAIUS * timeToLock) / t_max;
  return votingPower;
};
