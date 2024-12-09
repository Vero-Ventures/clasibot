'use client';

import { useState } from 'react';

import { CheckConnectionButton } from '@/components/inputs/index';

import { Button } from '@/components/ui/button';

import clsx from 'clsx';

interface ConnectionInstructionsProps {
  showCheckConnectionButton: boolean | null;
}

export default function ConnectionInstructions({
  showCheckConnectionButton,
}: ConnectionInstructionsProps) {
  const [isSingleCompany, setIsSingleCompany] = useState(true);

  return (
    <section className="m-8 transform rounded-lg bg-white px-4 py-10 shadow-lg mb:px-6 sm:px-8 md:px-12">
      <div className="flex flex-col items-center justify-center">
        <h1 className="mb-4 text-center text-3xl font-bold">
          How to connect Clasibot to your QuickBooks account
        </h1>
        <h2 className="mb-6 inline-block text-center text-xl font-semibold text-gray-700">
          Are you using Clasibot for a single company or an accounting firm?
        </h2>
        <div className="mb-2 flex w-full justify-center space-x-5 mb:space-x-12 md:justify-evenly md:space-x-0">
          <Button
            onClick={() => setIsSingleCompany(true)}
            className={clsx(
              'transform rounded-lg px-4 py-3 text-lg font-semibold text-white shadow-lg transition-all duration-300 ease-in-out sm:w-1/3',
              isSingleCompany
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:scale-105 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75'
                : 'bg-gray-500 hover:scale-105 hover:bg-gray-600'
            )}>
            Single Company
          </Button>
          <Button
            onClick={() => setIsSingleCompany(false)}
            className={clsx(
              'transform rounded-lg px-4 py-3 text-lg font-semibold text-white shadow-lg transition-all duration-300 ease-in-out sm:w-1/3',
              isSingleCompany
                ? 'bg-gray-500 hover:scale-105 hover:bg-gray-600'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:scale-105 hover:from-blue-700 hover:to-blue-800'
            )}>
            Accounting Firm
          </Button>
        </div>
        <div className="w-full max-w-2xl">
          {isSingleCompany ? (
            <>
              <p className="my-4 text-center font-semibold italic text-gray-900">
                If you plan to use Clasibot for a single company, add the
                Clasibot bookkeeper directly as a company accountant.
              </p>
              <h3 className="mb-4 mt-6 text-center text-2xl font-semibold sm:mt-8">
                Invite To Your Company
              </h3>
              <ol className="list-decimal pl-5 text-left text-gray-700">
                <li className="mb-2.5 marker:font-semibold">
                  Log into your QuickBooks Online company.
                </li>
                <li className="mb-2.5 marker:font-semibold">
                  Open the settings menu by clicking the gear icon in the top
                  right.
                </li>
                <li className="mb-2.5 marker:font-semibold">
                  Under the&nbsp;
                  <span className="font-semibold italic">
                    Your Company&nbsp;
                  </span>
                  options, find and select&nbsp;
                  <span className="font-semibold italic">Manage users.</span>
                </li>
                <li className="mb-2.5 marker:font-semibold">
                  Select&nbsp;
                  <span className="font-semibold italic">
                    Accounting Firms&nbsp;
                  </span>
                  to view your connected QuickBooks accountants.
                </li>
                <li className="mb-2.5 marker:font-semibold">
                  Determine the next steps for connecting to Clasibot:
                  <ol className="list-none pl-5">
                    <li className="mb-2.5 mt-2 marker:font-semibold">
                      <strong>A:&nbsp;</strong>
                      You have no other connected accountants.
                    </li>
                    <li className="mb-2.5 mt-2 marker:font-semibold">
                      <strong>B:&nbsp;</strong>
                      You already have other connected accountants.
                    </li>
                  </ol>
                </li>
              </ol>
              <h4 className="mb-4 mt-6 text-center text-2xl font-semibold sm:mt-8">
                A: Add Clasibot As First Accountant
              </h4>
              <ol className="list-decimal pl-5 text-left text-gray-700">
                <li className="mb-2.5 marker:font-semibold">
                  Select the&nbsp;
                  <span className="font-semibold italic">
                    Accountant&apos;s email&nbsp;
                  </span>
                  field option next to the invite button.
                </li>
                <li className="mb-2.5 marker:font-semibold">
                  Enter the email of the Clasibot bookkeeper:&nbsp;
                  <strong>synthetic-bookkeeper@invite.clasibot.com</strong>
                </li>
                <li className="mb-2.5 marker:font-semibold">
                  Click the invite button to invite the Clasibot bookkeeper.
                </li>
                <li className="mb-2.5 marker:font-semibold">
                  It may be necessary to enter an authorization code at this
                  step.
                </li>
                <li className="mb-2.5 marker:font-semibold">
                  Send the invite and wait for the Clasibot bookkeeper to accept
                  and join your company.
                </li>
              </ol>
              <h4 className="mb-4 mt-6 text-center text-2xl font-semibold sm:mt-8">
                B: Add Clasibot To Existing Accountant&apos;s
              </h4>
              <ol className="list-decimal pl-5 text-left text-gray-700">
                <li className="mb-2.5 marker:font-semibold">
                  Select the invite button in the top right of the screen to add
                  a new accountant.
                </li>
                <li className="mb-2.5 marker:font-semibold">
                  Give the Clasibot bookkeeper the name you want.
                </li>
                <li className="mb-2.5 marker:font-semibold">
                  Enter the email of the Clasibot bookkeeper:&nbsp;
                  <strong>synthetic-bookkeeper@invite.clasibot.com</strong>
                </li>
                <li className="mb-4 marker:font-semibold">
                  Send the invite and wait for the Clasibot accountant to accept
                  and join your company.
                </li>
              </ol>
              {showCheckConnectionButton ? (
                <div className="mx-auto flex min-w-80 flex-col items-center justify-center p-4 mb:w-2/3 sm:w-1/2">
                  <CheckConnectionButton />
                </div>
              ) : (
                <div className="py-2" />
              )}
              <h4 className="mb-2 mt-4 text-center text-2xl font-semibold sm:mb-4 md:mt-6">
                Connection Troubleshooting
              </h4>
              <p className="mb-4 text-gray-700">
                If the connection to the company has been deactivated, the
                Clasibot bookkeeper will not be able to connect to that company,
                even if it still has client access through QuickBooks.
              </p>
              <p className="text-md ml-6 mr-4 text-center font-semibold text-gray-700">
                Simply delete the Clasibot bookkeeper then invite it back to
                have the Clasibot bookkeeper&nbsp;
                <span className="inline-block">re-activate</span> its
                connection.
              </p>
            </>
          ) : (
            <>
              <p className="my-4 text-center font-semibold italic text-gray-900">
                If you plan to use Clasibot for multiple client companies, add
                the Clasibot bookkeeper to your accounting company.
              </p>
              <h3 className="mb-4 mt-6 text-center text-2xl font-semibold sm:mt-8">
                Navigate To Firm Users
              </h3>
              <ol className="list-decimal pl-5 text-left text-gray-700">
                <li className="mb-2.5 marker:font-semibold">
                  Log into your QuickBooks Online accountant company.
                </li>
                <li className="mb-2.5 marker:font-semibold">
                  Open the settings menu by clicking the gear icon in the top
                  right.
                </li>
                <li className="mb-2.5 marker:font-semibold">
                  Under the&nbsp;
                  <span className="font-semibold italic">
                    Your Company&nbsp;
                  </span>
                  options, find and select&nbsp;
                  <span className="font-semibold italic">Your team.</span>
                </li>
                <li className="mb-2.5 marker:font-semibold">
                  Check the top to ensure you are under the&nbsp;
                  <span className="font-semibold italic">Users&nbsp;</span>
                  tab.
                </li>
              </ol>
              <h4 className="mb-4 mt-6 text-center text-2xl font-semibold sm:mt-8">
                Invite To Your Accounting Firm
              </h4>
              <ol className="list-decimal pl-5 text-left text-gray-700">
                <li className="mb-2.5 marker:font-semibold">
                  Select&nbsp;
                  <span className="font-semibold italic">Add user&nbsp;</span>
                  to start adding the Clasibot bookkeeper to your accounting
                  team.
                </li>
                <li className="mb-2.5 marker:font-semibold">
                  Give the Clasibot bookkeeper the name you want.
                </li>
                <li className="mb-2.5 marker:font-semibold">
                  Enter the email of the Clasibot bookkeeper:&nbsp;
                  <strong>synthetic-bookkeeper@invite.clasibot.com</strong>
                </li>
                <li className="mb-2.5 marker:font-semibold">
                  Select the&nbsp;
                  <span className="font-semibold italic">
                    Standard no access&nbsp;
                  </span>
                  option for Clasibot&apos;s permissions.
                </li>
                <li className="mb-2.5 marker:font-semibold">
                  Send the invite and wait for the Clasibot accountant to accept
                  and join your accounting firm.
                </li>
              </ol>
              <h4 className="mb-4 mt-6 text-center text-2xl font-semibold sm:mt-8">
                Check That The Invite Has Been Accepted
              </h4>
              <ol className="list-decimal pl-5 text-left text-gray-700">
                <li className="mb-2.5 marker:font-semibold">
                  Wait a few minutes for Clasibot to receive and accept your
                  invite.
                </li>
                <li className="mb-2.5 marker:font-semibold">
                  Find the user with the&nbsp;
                  <strong>bookkeeper@invite.clasibot.com</strong> email and the
                  name you chose to give the Clasibot bookkeeper.
                </li>
                <li className="mb-2.5 marker:font-semibold">
                  Check that the invite has been accepted by looking under the
                  status column.
                </li>
                <li className="mb-2.5 marker:font-semibold">
                  If the value says&nbsp;
                  <span className="font-semibold italic">Active&nbsp;</span>
                  you are ready to continue.
                </li>
                <li className="mb-2.5 marker:font-semibold">
                  If the value still says&nbsp;
                  <span className="font-semibold italic">Invited&nbsp;</span>,
                  try refreshing the page.
                </li>
              </ol>
              <h4 className="mb-4 mt-6 text-center text-2xl font-semibold sm:mt-8">
                Grant Access To The Client Companies
              </h4>
              <ol className="list-decimal pl-5 text-left text-gray-700">
                <li className="mb-2.5 marker:font-semibold">
                  Select the&nbsp;
                  <span className="font-semibold italic">Edit&nbsp;</span>
                  option for the Clasibot bookkeeper.
                </li>
                <li className="mb-2.5 marker:font-semibold">
                  Scroll down to the section labeled&nbsp;
                  <span className="font-semibold italic">
                    Access to clients&nbsp;
                  </span>
                  and open the&nbsp;
                  <span className="font-semibold italic">
                    Edit client access&nbsp;
                  </span>
                  dropdown.
                </li>
                <li className="mb-2.5 marker:font-semibold">
                  Select the client you are presently logged in as to grant the
                  Clasibot bookkeeper access.
                </li>
                <li className="mb-4 marker:font-semibold">
                  Click save changes and wait for the Clasibot bookkeeper to
                  update its connection to your client&apos;s company.
                </li>
              </ol>
              {showCheckConnectionButton ? (
                <div className="mx-auto flex flex-col items-center justify-center p-4 mb:w-2/3 sm:w-1/2">
                  <CheckConnectionButton />
                </div>
              ) : (
                <div className="py-2" />
              )}
              <div className="px-4 md:px-0">
                <h4 className="text-2lg mb-2 mt-4 text-center text-2xl font-semibold sm:mb-4 md:mt-6">
                  Connection Troubleshooting
                </h4>
                <p className="mb-4 text-gray-700">
                  Ensure that you have logged into Clasibot as the client before
                  granting the bookkeeper access. It will accept access to any
                  companies that have not been authenticated through logging
                  into the Clasibot application.
                </p>
                <p className="text-md mb-6 ml-6 mr-4 text-center font-semibold text-gray-700">
                  If access has already been granted, simply edit the Clasibot
                  bookkeeper to remove the access, log in to the client company,
                  then grant the client access again.
                </p>
                <p className="mb-4 text-gray-700">
                  If the connection to the client company has been deactivated,
                  the Clasibot bookkeeper will not be able to connect to that
                  company, even if it still has client access through
                  QuickBooks.
                </p>
                <p className="text-md ml-6 mr-4 text-center font-semibold text-gray-700">
                  Simply edit the Clasibot bookkeeper to remove the access then
                  grant it again to have the Clasibot bookkeeper&nbsp;
                  <span className="inline-block">re-activate</span> its
                  connection.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
