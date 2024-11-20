'use server';

// Finds the time the next backend Classification will occurr and converts it to a local string.
// Returns: The time and date as a localized string.
export async function getNextReviewDate(): Promise<string> {
  // Create a date object and get the current day of the week in the UTC time zone.
  const date = new Date();
  const dayOfTheWeek = date.getUTCDay();

  // Determine the current number of days away from Saturday for this week.
  let daysUntilClassify = 6 - dayOfTheWeek;
  // Saturday and Sunday will result in a value less than one .
  if (daysUntilClassify < 1) {
    // Add 7 to the difference to get the number of days until next Saruday.
    daysUntilClassify += 7;
  }

  // Use the number of days until Saturday to get the UTC date of the next Classification.
  const nextClassifyUTC = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + daysUntilClassify
    )
  );

  // Format the next Classification date into the local time zone.
  // Uses the format wanted for the frontend display : "Jan 01, 12:00 PM"
  const formattedDate = nextClassifyUTC.toLocaleString('en-US', {
    month: 'short', // 'Jan'
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true, // 'AM/PM'
  });

  // Change the comma in the string to an @ symbol before returning to be displayed.
  const displayDate = formattedDate.replace(',', ' @');

  // Return the next Classification date value.
  return displayDate;
}
