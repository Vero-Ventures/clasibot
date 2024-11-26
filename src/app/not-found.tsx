import Link from 'next/link';

// 404 page handler.
const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center bg-gray-100 pt-20 md:pt-40">
      <h1 className="mb-4 text-6xl font-bold text-gray-800">404</h1>
      <p className="mb-8 text-2xl text-gray-600">Page Not Found</p>
      <Link
        href="/"
        className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75">
        Return To Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
