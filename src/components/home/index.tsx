'use client';
import { useState, useEffect } from 'react';
import { classifyTransactions } from '@/actions/classify';
import { getTransactions } from '@/actions/quickbooks/get-transactions';
import {
  getCompanyName,
  getCompanyIndustry,
  getCompanyLocation,
} from '@/actions/quickbooks/user-info';
import { checkSubscription } from '@/actions/stripe';
import { UnpaidAlert } from '@/components/unpaid-alert';
import ReviewPage from '@/components/home/review-page';
import SelectionPage from '@/components/home/selection-page';
import { useToast } from '@/components/ui/toasts/use-toast';
import type { ClassifiedCategory } from '@/types/Category';
import type { CompanyInfo } from '@/types/CompanyInfo';
import type {
  FormattedForReviewTransaction,
  CategorizedForReviewTransaction,
} from '@/types/ForReviewTransaction';

export default function HomePage() {
  // Create states to track and set the important values.
  // Catagorized transactions, catagorization results, if classification is currently in progress, -
  // - if the user is subscribed, and the company name.
  const [categorizedTransactions, setCategorizedTransactions] = useState<
    CategorizedForReviewTransaction[]
  >([]);
  const [categorizationResults, setCategorizationResults] = useState<
    Record<string, ClassifiedCategory[]>
  >({});
  const [isClassifying, setIsClassifying] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState('');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    industry: '',
    location: { Country: '', Location: '' },
  });

  // Define a state to track if the modal is open.
  const [modal, setModal] = useState(false);

  // Define states to prevent showing the table until the page is loaded.
  const [finishedLoadingIndustry, _setFinishedLoadingIndustry] = useState(true);
  const [finishedLoadingSubscription, setFinishedLoadingSubscription] =
    useState(false);

  // Check the url for the 'activated' query parameter and set the modal state accordingly.
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('activated') === 'true') {
      setModal(true);
    }
  }, []);

  // Gets the important company info and stores it as one object.
  // *** NOTE: Presently does not update industry, update in future. ***
  const getCompanyInfo = async () => {
    const userCompanyName = await getCompanyName();
    const userCompanyIndustry = await getCompanyIndustry();
    const userCompanyLocation = await getCompanyLocation();
    setCompanyInfo({
      name: userCompanyName,
      industry: userCompanyIndustry,
      location: JSON.parse(userCompanyLocation),
    });
  };

  // Define the toast function using the useToast hook.
  const { toast } = useToast();

  // Define a function to check for valid user subsciptions.
  const checkUserSubscription = async () => {
    const subscriptionResponse = await checkSubscription();
    if ('error' in subscriptionResponse || !subscriptionResponse.valid) {
      setIsSubscribed('false');
    } else {
      setIsSubscribed('true');
    }
    setFinishedLoadingSubscription(true);
  };

  // Use the useEffect hook to call the setup methods on page load.
  useEffect(() => {
    // Check the user subscription and get the company info.
    checkUserSubscription();
    getCompanyInfo();
  }, []);

  // Create a list of catagorized transactions using a list of transactions and a result object.
  const createCategorizedTransactions = (
    selectedRows: FormattedForReviewTransaction[],
    result: Record<string, ClassifiedCategory[]>
  ) => {
    const newCategorizedTransactions: CategorizedForReviewTransaction[] = [];

    // Iterate through the selected rows and add the categorized transactions to the array.
    for (const transaction of selectedRows) {
      // Define the formatted transaction from the dual "For Review" transaction array.
      newCategorizedTransactions.push({
        transaction_ID: transaction.transaction_ID,
        name: transaction.name,
        date: transaction.date,
        account: transaction.account,
        amount: transaction.amount,
        // Get the categories from the result object using its ID. Gets an empty array if no match is found.
        categories: result[transaction.transaction_ID] || [],
      });
    }
    return newCategorizedTransactions;
  };

  // Handle classifing selected transactions from a list of transactions.
  async function handleClassify(selectedRows: FormattedForReviewTransaction[]) {
    const subscriptionStatus = await checkSubscription();

    if ('error' in subscriptionStatus || !subscriptionStatus.valid) {
      // Set the subscription status to false and show a toast message.
      setIsSubscribed('false');
      toast({
        variant: 'destructive',
        title: 'Notice',
        description:
          'Transaction classification will not work until you pay for the subscription.',
      });
      return;
    }

    // If the subscription is valid, set the 'is classifying' status to true.
    setIsClassifying(true);

    // Get a reference for the current date and the date 5 years ago.
    const today = new Date();
    const setBackRange = 5;
    const fiveYearsAgo = new Date(
      today.getFullYear() - setBackRange,
      today.getMonth(),
      today.getDate()
    );

    // Convert the dates to start date and end date strings in the format 'YYYY-MM-DD'.
    const startDate = today.toISOString().split('T')[0];
    const endDate = fiveYearsAgo.toISOString().split('T')[0];

    // Get the past transactions from QuickBooks for checking matches.
    const pastTransactions = await getTransactions(startDate, endDate);
    const pastTransactionsResult = JSON.parse(pastTransactions).slice(1);

    // Classify the transactions that are not uncategorized.
    const result: Record<string, ClassifiedCategory[]> | { error: string } =
      await classifyTransactions(
        pastTransactionsResult,
        selectedRows,
        companyInfo
      );

    if ('error' in result) {
      console.error('Error classifying transactions:', result.error);
      return;
    }

    // Set the categorization results and catagorized transactions using the result object.
    setCategorizationResults(result);
    setCategorizedTransactions(
      createCategorizedTransactions(selectedRows, result)
    );

    // Set the 'is classifying' status to false.
    setIsClassifying(false);
  }

  // Return the base homepage content and determine which table should be displayed.
  return (
    <div id="TableContainer" className="container mx-auto px-4 py-8">
      {/* Display an alert if they are not subscribed. */}
      {isSubscribed === 'false' && <UnpaidAlert />}

      {/* If there are categorized transactions, display the review page. */}
      {categorizedTransactions.length > 0 ? (
        <ReviewPage
          categorizedTransactions={categorizedTransactions}
          categorizationResults={categorizationResults}
          company_info={companyInfo}
        />
      ) : (
        // Otherwise display the selection page.
        <SelectionPage
          handleClassify={handleClassify}
          isClassifying={isClassifying}
          company_info={companyInfo}
          finished_loading={
            finishedLoadingIndustry && finishedLoadingSubscription
          }
        />
      )}
      {/* Show a modal informing new users their account is activated.*/}
      <div
        className={`fixed left-0 top-0 flex h-full w-full items-center justify-center bg-gray-900 bg-opacity-50 ${modal && isSubscribed === 'true' ? '' : 'hidden'}`}>
        <div className="mx-4 w-96 rounded-lg bg-white p-6">
          <h2
            id="ResultTitle"
            className="mb-4 text-center text-2xl font-bold text-green-500">
            Account Activated
          </h2>
          <p
            id="ResultMessage"
            className="mb-6 text-center font-medium text-gray-800">
            You can now classify and save transactions.
          </p>
          <button
            className="mx-28 h-12 w-28 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
            onClick={() => setModal(false)}>
            {' '}
            Close{' '}
          </button>
        </div>
      </div>
    </div>
  );
}
