import Link from 'next/link';

// The 404 page component that displays a link to the home page.
const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center bg-gray-100 pt-20 md:pt-40">
      <h1 id="ErrorCode" className="font-bold text-gray-800 text-6xl mb-4">
        404
      </h1>
      <p id="ErrorMessage" className="text-gray-600 text-2xl mb-8">
        Page Not Found
      </p>
      <Link
        id="HomePageLink"
        href="/"
        className="bg-blue-600 transition-colors duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75
         text-white rounded-lg shadow-md px-6 py-3">
        Go Back Home
      </Link>
    </div>
  );
};

// Export the NotFoundPage component.
export default NotFoundPage;
