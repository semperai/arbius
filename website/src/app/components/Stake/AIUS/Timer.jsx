import { useEffect, useState } from 'react';

const Timer = ({ epochTimestamp }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(epochTimestamp));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(epochTimestamp));
    }, 1000);

    return () => clearInterval(timer);
  }, [epochTimestamp]);

  function calculateTimeLeft(epochTimestamp) {
    const now = new Date().getTime(); // Current time in milliseconds
    const difference = epochTimestamp - now; // Difference between Sunday and now

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }

  return (
      <>
      <span className="hidden md:inline">{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</span>
      <span className="inline md:hidden">{timeLeft.days}:{timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}</span>
      </>
  );
};

export default Timer;