import React from 'react';

export const Navbar = () => (
  <header className="bg-white shadow">
    <div className="container mx-auto flex items-center justify-between px-4 py-4">
      <h1 className="text-2xl font-bold text-gray-800">Clasibot</h1>
      <nav>
        <a
          href="#how-it-works"
          className="mx-4 text-gray-600 hover:text-blue-500">
          How it Works
        </a>
        <a
          href="#why-quickbooks"
          className="mx-4 text-gray-600 hover:text-blue-500">
          Why QuickBooks
        </a>
        <a href="#demo" className="mx-4 text-gray-600 hover:text-blue-500">
          Demo
        </a>
      </nav>
    </div>
  </header>
);
