import ProgressBar from '../progress-bar';

interface ManualClassifyModalProps {
  manualClassificationState: string,
  isVisible: boolean
}

const ManualClassifyModal = ({
  manualClassificationState,
  isVisible,
}: ManualClassifyModalProps) => {
  let displayMessage: string;

  switch (manualClassificationState) {
    case 'Start Classify':
      displayMessage = 'Starting classification...';
      // Called before beggining the Classification process - Set frontend element to be shown.
      break;
    case 'Synthetic Login':
      displayMessage = 'Clasibot logging in...';
      // Called before starting the synthetic login process used to access the User Account.
      break;
    case 'Get For Review Transactions':
      displayMessage = "Fetching 'For Review' transactions...";
      // Called before getting the 'For Reivew' transactions to be classified.
      break;
    case 'Get Saved Transactions':
      displayMessage = 'Fetching previously classified transactions...';
      // Called before getting the saved and Classified Transactions from QuickBooks for prediction use.
      break;
    case 'Classify For Review Transactions':
      displayMessage = "Evaluating 'For Review' transactions...";
      // Called before starting the process to create the Transaction Classifications.
      break;
    case 'Create New Classified Transactions':
      displayMessage = "Predicting 'For Review' transactions...";
      // Called before using predictions to create Classified 'For Review' transactions.
      break;
    case 'Save New Classified Transactions':
      displayMessage = 'Saving the newly classified transactions...';
      // Called before saving the newly Classified 'For Review' transactions to the database.
      break;
    case 'Load New Classified Transactions':
      displayMessage = 'Loading the newly classified transactions...';
      // Called before loading the newly Classified transactions from the database to be displayed.
      break;
    case 'Classify Complete':
        displayMessage = 'Classification Complete!'
        break;
    default:
      displayMessage = 'Classifying';
      break;
  }

  return (
    <div
      className={`fixed left-0 top-0 flex h-full w-full items-center justify-center bg-gray-900 bg-opacity-50 ${isVisible ? '' : 'hidden'}`}>
      <div className="mx-4 flex w-96 flex-col space-y-4 rounded-lg bg-white p-6">
        <p id="ResultMessage" className="text-center font-medium text-gray-800">
          {displayMessage}
        </p>
        <ProgressBar progress={manualClassificationState} />
      </div>
    </div>
  );
};

export default ManualClassifyModal;