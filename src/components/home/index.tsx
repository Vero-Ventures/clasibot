/**
 * Defines the primary content displayed on the homepage.
 * Contains inital setup for the tables to be displayed on the page (selection & review).
 */
'use client';
import { useState, useEffect } from 'react';
import { classifyTransactions } from '@/actions/classify';
import {
  getTransactions,
  findIndustry,
  getCompanyName,
} from '@/actions/quickbooks';
import { checkSubscription } from '@/actions/stripe';
import { filterCategorized } from '@/utils/filter-transactions';
import { getSession } from 'next-auth/react';
import ReviewPage from '@/components/home/review-page';
import SelectionPage from '@/components/home/selection-page';
import { UnpaidAlert } from '@/components/unpaid-alert';
import { useToast } from '@/components/ui/use-toast';
import type { ClassifiedCategory } from '@/types/Category';
import type { CategorizedTransaction, Transaction } from '@/types/Transaction';

export default function HomePage() {
  // Define a state to track and set categorized transactions.
  const [categorizedTransactions, setCategorizedTransactions] = useState<
    CategorizedTransaction[]
  >([]);

  // Define a state to track and set categorization results.
  const [categorizationResults, setCategorizationResults] = useState<
    Record<string, ClassifiedCategory[]>
  >({});

  // Define a state to track and set the classification status.
  const [isClassifying, setIsClassifying] = useState(false);

  // Define a state to track and set the subscription status.
  const [isSubscribed, setIsSubscribed] = useState(true);

  // Define a state to track and set the company name.
  const [companyName, setCompanyName] = useState('');

  // Async function to call company name and update use state.
  const callCompanyName = async () => {
    // Get the company name from QuickBooks and use the set state function to update the company name.
    const userCompanyName = await getCompanyName();
    setCompanyName(userCompanyName);
  };

  // Define the toast function using the useToast hook.
  const { toast } = useToast();

  // Define the updateIndustry function.
  const updateIndustry = async () => {
    // Get the industry from QuickBooks.
    const industry = await findIndustry();
    // Get the user session and extract the email from it.
    const session = await getSession();
    const email = session?.user?.email;

    if (email) {
      // If the email is found, send a POST request to the update-industry endpoint.
      try {
        const response = await fetch('/api/update-industry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // Stringify the industry and email in the request body.
          body: JSON.stringify({ industry, email }),
        });

        // If the response is not ok, throw an error.
        if (!response.ok) {
          throw new Error('Failed to update industry');
        }
      } catch (error) {
        // Log the error if the request fails.
        console.error('Error updating industry:', error);
      }
    } else {
      // Log an error if the email is not found in the session.
      console.error('No user email found in session');
    }
  };

  // Define the checkUserSubscription function.
  const checkUserSubscription = async () => {
    // Get the subscription status from the checkSubscription function.
    const subscriptionResponse = await checkSubscription();
    // Set the subscription status using the setIsSubscribed state.
    // Set to true if there is no error and the subscription is valid.
    if ('error' in subscriptionResponse || !subscriptionResponse.valid) {
      setIsSubscribed(false);
    } else {
      setIsSubscribed(true);
    }
  };

  // Use the useEffect hook to call above methods for on page load actions.
  useEffect(() => {
    // Call the company name function, check the user subscription, and update the industry.
    callCompanyName();
    checkUserSubscription();
    updateIndustry();
  }, []);

  // Define the createCategorizedTransactions function which takes a list of transactions and a result object.
  const createCategorizedTransactions = (
    selectedRows: Transaction[],
    result: Record<string, ClassifiedCategory[]>
  ) => {
    // Create a new array to store the categorized transactions.
    const newCategorizedTransactions: CategorizedTransaction[] = [];

    // Iterate through the selected rows and add the categorized transactions to the array.
    for (const transaction of selectedRows) {
      // Push the transaction details to the categorized transactions array.
      newCategorizedTransactions.push({
        date: transaction.date,
        transaction_type: transaction.transaction_type,
        transaction_ID: transaction.transaction_ID,
        name: transaction.name,
        account: transaction.account,
        // Get the categories from the result object using its ID. Gets an empty array if no match is found.
        categories: result[transaction.transaction_ID] || [],
        amount: transaction.amount,
      });
    }

    // Return the categorized transactions array.
    return newCategorizedTransactions;
  };

  // Define the handleClassify function which takes a list of transactions.
  async function handleClassify(selectedRows: Transaction[]) {
    // Get the current subscription status.
    const subscriptionStatus = await checkSubscription();

    // If there is an error or the subscription is not valid:
    if ('error' in subscriptionStatus || !subscriptionStatus.valid) {
      // Set the subscription status to false and show a toast message.
      setIsSubscribed(false);
      toast({
        variant: 'destructive',
        title: 'Notice',
        description:
          'Transaction classification will not work until you pay for the subscription.',
      });
      return;
    }

    // If the subscription is valid, set the classifying status to true.
    setIsClassifying(true);

    // Get a reference for the current date and the date 5 years ago.
    const today = new Date();
    const setBackRange = 5;
    const fiveYearsAgo = new Date(
      today.getFullYear() - setBackRange,
      today.getMonth(),
      today.getDate()
    );

    // Convert the dates to strings in the format 'YYYY-MM-DD'.
    const startDate = today.toISOString().split('T')[0];
    const endDate = fiveYearsAgo.toISOString().split('T')[0];

    // Get the past transactions from QuickBooks.
    const pastTransactions = await getTransactions(startDate, endDate);
    const pastTransactionsResult = JSON.parse(pastTransactions).slice(1);

    // Classify the passed transactions and record the results.
    const result: Record<string, ClassifiedCategory[]> | { error: string } =
      // Use the past 5 years of transactions to classify the passed transactions.
      await classifyTransactions(
        filterCategorized(pastTransactionsResult),
        selectedRows
      );
    if ('error' in result) {
      // Log an error and return if the classification fails.
      console.error('Error classifying transactions:', result.error);
      return;
    }

    // Set the categorization results using the result object.
    setCategorizationResults(result);

    // Set the categorized transactions using the selected rows and the result object.
    setCategorizedTransactions(
      createCategorizedTransactions(selectedRows, result)
    );

    // Set the classifying status to false.
    setIsClassifying(false);
  }

  // Return the base homepage content and the current table to be displayed.
  return (
    <div id="TableContainer" className="container mx-auto px-4 py-8">
      {/* Display an alert if they are not subscribed. */}
      {!isSubscribed && <UnpaidAlert />}

      {/* If there are categorized transactions, display the review page. */}
      {categorizedTransactions.length > 0 ? (
        <ReviewPage
          categorizedTransactions={categorizedTransactions}
          categorizationResults={categorizationResults}
          company_name={companyName}
        />
      ) : (
        // Otherwise display the selection page.
        <SelectionPage
          handleClassify={handleClassify}
          isClassifying={isClassifying}
          company_name={companyName}
        />
      )}
    </div>
  );
}
