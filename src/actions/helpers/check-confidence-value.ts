// Takes: The Classification method of a 'For Review' transaction.
// Returns: The Confidence Value of the Classification method.
export function checkConfidenceValue(classificationMethod: string) {
  // Create a dictionary to connect the Classification methods to their Confidence Values.
  const confidenceValueDictionary: { [key: string]: number } = {
    LLM: 1,
    Database: 2,
    Matching: 3,
  };

  // Return the Confidence Values of the Classification method.
  return confidenceValueDictionary[classificationMethod];
}
