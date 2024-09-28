
export default function Page() {
  return (
    <div style={{ backgroundColor: '#f0f0f0' }}>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="mb-8 rounded bg-white py-16 text-center shadow-md">
          <p className="mb-8 text-lg">Call to Action + QuickBooks Sign In</p>
          <button className="rounded bg-blue-500 px-6 py-2 text-white">
            Get Started
          </button>
        </section>

        {/* How it Works Section */}
        <section className="mb-8 rounded bg-white py-16 shadow-md">
          <h2 className="mb-8 text-center text-3xl font-bold">How it Works</h2>
          <p className="mb-4 text-gray-700">
            Clasibot makes use of a three-step classification pipeline system to
            automatically classify your transactions while ensuring the highest
            accuracy possible.
          </p>
          <ol className="list-inside list-decimal space-y-4">
            <li>
              It will review your past transactions for any matches and evaluate
              them to find the ones with the highest likelihood of correctly
              predicting the classification and tax code. This process
              eliminates the tedium of classifying common transactions that
              appear often for the business.
            </li>
            <li>
              The transaction is then checked against our personalized database
              to find potential predictors. Our system finds the classifications
              for similar transactions and determines the most common
              classifications. The resulting transactions are compared against
              each other to find the ones that provide the highest likelihood of
              a match.
            </li>
            <li>
              Our system gathers information about the transaction's vendor and
              makes use of our personalized AI system to automatically predict
              which of your transaction classifications is the best match as
              well as the most likely tax code to apply. This produces valuable
              and reliable predictions for any transactions, no matter how
              obscure the business.
            </li>
          </ol>
        </section>

        {/* Why QuickBooks Section */}
        <section className="mb-8 rounded bg-white py-16 shadow-md">
          <h2 className="mb-8 text-center text-3xl font-bold">
            Why QuickBooks
          </h2>
          <p className="mb-4 text-gray-700">
            Clasibot makes it fast and simple to classify your transactions and
            assign them the proper tax code. Just sign up and add our automatic
            bookkeeper to your company or accounting firm. Every week, your
            newest transactions will be automatically classified and stored for
            your review. The next time you log in, you simply select the
            transactions you want to save and Clasibot will automatically update
            them in the QuickBooks company.
          </p>
          <p className="mb-4 text-gray-700">
            This process fast tracks the tedious process of reviewing
            transactions for classification and tax code assignment. Our system
            is focused on making this process as fast and as possible by
            minimizing the need for a repetitive selection and approval process
            for each transaction. Our goal at Clasibot is to make your life
            easier and free up your time to do the work that really matters.
          </p>
          <p className="mb-4 text-gray-700">
            Our robust system results in highly accurate predictions for all
            your transactions, from repeated business with large companies to
            one-time purchases from local small businesses. If a transaction is
            associated with multiple classifications, it will evaluate the
            options and recommend the most probable classification. Clasibot
            also provides an option to select from the other potentially valid
            classifications if needed. They can be selected from a dropdown in
            order of likelihood to ensure a smooth process for your more unusual
            transactions.
          </p>
        </section>

        {/* Demo Video Section */}
        <section className="mb-8 rounded bg-white py-16 text-center shadow-md">
          <h2 className="mb-8 text-3xl font-bold">The QuickBooks Process</h2>
          <p className="mb-4 text-gray-700">Demo Video (To be recorded)</p>
        </section>
      </main>
    </div>
  );
}
