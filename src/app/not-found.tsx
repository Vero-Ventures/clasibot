import Link from 'next/link';

// The 404 page component that displays a link to the home page.
const NotFoundPage = () => {
  return (
    <div
      id="404PageContainer"
      className="flex flex-col items-center justify-center bg-gray-100 pt-20 md:pt-40">
      <h1 id="ErrorCode" className="mb-4 text-6xl font-bold text-gray-800">
        404
      </h1>
      <p id="ErrorMessage" className="mb-8 text-2xl text-gray-600">
        Page Not Found
      </p>
      <Link
        id="HomePageLink"
        href="/"
        className="rounded-lg bg-blue-600 px-6 py-3 text-white shadow-md transition-colors duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75">
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
