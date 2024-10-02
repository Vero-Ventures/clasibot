import { useState } from 'react';
import { Button } from '../ui/button';
import Link from 'next/link';
import clsx from 'clsx';

export default function AddSBKInstructions() {
  const [isBusiness, setIsBusiness] = useState(true);

  return (
    <div
      id="addSBKInstructions"
      className="container flex flex-col items-center justify-center space-y-5">
      <h1 className="text-2xl md:text-3xl">
        Add Clasibot to your Quick Books Organization now!
      </h1>
      <h1 className="text-lg md:text-xl">
        Are you a business or an accountant?
      </h1>
      <div className="flex w-full justify-center space-x-5">
        <Button
          id="addSBKBusinessButton"
          onClick={() => setIsBusiness(true)}
          className={clsx(
            'w-full rounded-lg px-4 py-2 text-white shadow-md transition-colors duration-300 md:w-auto',
            isBusiness
              ? 'bg-blue-500 hover:bg-blue-700'
              : 'bg-gray-500 hover:bg-blue-700'
          )}>
          Business
        </Button>
        <Button
          id="addSBKAccountantButton"
          onClick={() => setIsBusiness(false)}
          className={clsx(
            'w-full rounded-lg px-4 py-2 text-white shadow-md transition-colors duration-300 md:w-auto',
            isBusiness
              ? 'bg-gray-500 hover:bg-blue-700'
              : 'bg-blue-500 hover:bg-blue-700'
          )}>
          Accountant
        </Button>
      </div>
      {isBusiness ? (
        <div>
          <ol id="addSBKBusinessList" className="m-0 list-decimal pl-5 text-lg">
            <li className="mb-2.5">Log into your QuickBooks Online company.</li>
            <li className="mb-2.5">Open the settings menu.</li>
            <li className="mb-2.5">
              Under the “Your Company” menu, select “Manage users”.
            </li>
            <li className="mb-2.5">
              Select “Accounting Firms” to view connected QuickBooks Accountant
              profiles.
            </li>
            <li className="mb-2.5">
              Start inviting a new accountant firm to your company.
            </li>
            <li className="mb-2.5">
              Give the Clasibot accountant the name you want to use and the
              email “admin@clasibot.com”.
            </li>
            <li className="mb-2.5">
              Send the invite and wait for the Clasibot accountant to accept and
              join your company.
            </li>
          </ol>
        </div>
      ) : (
        <div>
          <ol
            id="addSBKAccountantList"
            className="m-0 list-decimal pl-5 text-lg">
            <li className="mb-2.5">Log into your QuickBooks Online company.</li>
            <li className="mb-2.5">
              Open the “Your Practice” menu in the side bar and select the
              “Team” section.
            </li>
            <li className="mb-2.5">
              Start adding a new user to your accounting firm.
            </li>
            <li className="mb-2.5">
              Give the Clasibot accountant the name you want to use and the
              email “admin@clasibot.com”.
            </li>
            <li className="mb-2.5">
              Select the “standard no access” option for Clasibot’s permissions.
            </li>
            <li className="mb-2.5">
              Scroll to the bottom of the invite and open the “Access to
              clients” menu.
            </li>
            <li className="mb-2.5">
              Give the Clasibot accountant permissions for the companies you
              want it to access.
            </li>
            <li className="mb-2.5">
              Send the invite and wait for the Clasibot accountant to accept and
              join your accounting firm.
            </li>
          </ol>
        </div>
      )}
      <h1 className="text-lg md:text-xl">
        Please click below after all steps have been completed!
      </h1>
      <Button>
        <Link id="HomePageLink" href="/home">
          Continue
        </Link>
      </Button>
    </div>
  );
}
