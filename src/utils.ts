export const formatTime = (unixTime: number): string => {
    const date = new Date(unixTime * 1000);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}/${day}`;
};

/** 
 * Returns the Unix time at midnight (00:00:00) of the current day.
 * @returns The Unix time in milliseconds for the start of the current day.
 */
export const getCurrentDayUnixTime = (): number => {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor(midnight.getTime() / 1000);
}


