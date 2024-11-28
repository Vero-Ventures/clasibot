// Takes: The string Classification method of a 'For Review' transaction.
// Returns: A numberical representation of the confidence value.
export function checkConfidenceValue(classificationMethod: string) {
  // Create a dictionary to connect the strings to their related values.
  const confidenceValueDictionary: { [key: string]: number } = {
    'LLM API': 1,
    Database: 2,
    Matching: 3,
  };

  // Return the value related to the passed string.
  return confidenceValueDictionary[classificationMethod];
}
