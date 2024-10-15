export async function manualReview(
  setManualReviewState: (newState: string) => void
) {
  // Preform the manual review for the current user company.
  // Update the manual review to indicate the process has started.
  setManualReviewState('Loading Transactions ...');
}
