'use server';

// Finds the time the next backend Classification will occurr and converts it to a local string.
// Takes: State update method to record the date string.
// Returns: None, uses state updaters to pass result frontend.
export async function getNextReviewDate(
  setNextBackendClassifyDate: (newState: string) => void
) {
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

  // Update the state tracking the next Classification date value.
  // Using toString() converts from the UTC time to the local time zone of the user.
  setNextBackendClassifyDate(nextClassifyUTC.toString());
}
