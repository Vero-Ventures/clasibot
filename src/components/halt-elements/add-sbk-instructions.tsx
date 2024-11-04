'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import clsx from 'clsx';
import CheckConnectionButton from '../inputs/check-connection-button';

interface AddSBKInstructionsProps {
  showCheckConnectionButton: boolean | null;
}

export default function AddSBKInstructions({
  showCheckConnectionButton,
}: AddSBKInstructionsProps) {
  const [isSingleCompany, setIsSingleCompany] = useState(false);

  return (
    <section className="m-8 transform rounded-lg bg-white px-4 py-10 shadow-lg mb:px-6 sm:px-8 md:px-12">
      <div className="flex flex-col items-center justify-center">
        <h1 className="mb-4 text-center text-3xl font-bold text-black">
          <span className="inline-block">How to connect Clasibot&nbsp;</span>
          <span className="inline-block">to your QuickBooks account</span>
        </h1>
        <h2 className="mb-6 inline-block text-center text-lg text-gray-700">
          Are you using Clasibot for a&nbsp;
          <span className="inline-block">
            single company or an accounting firm?
          </span>
        </h2>
        <div className="mb-2 flex w-full justify-center space-x-5 mb:space-x-12 md:justify-evenly md:space-x-0">
          <Button
            onClick={() => setIsSingleCompany(true)}
            className={clsx(
              'text-md transform rounded-lg px-4 py-3 font-semibold text-white shadow-md transition-transform duration-300 sm:w-1/3',
              isSingleCompany
                ? 'bg-gradient-to-r from-blue-500 to-blue-700 hover:scale-105 hover:from-blue-600 hover:to-blue-800'
                : 'bg-gray-500 hover:scale-105 hover:bg-gray-700'
            )}>
            Single Company
          </Button>
          <Button
            onClick={() => setIsSingleCompany(false)}
            className={clsx(
              'text-md transform rounded-lg px-4 py-3 font-semibold text-white shadow-md transition-transform duration-300 sm:w-1/3',
              isSingleCompany
                ? 'bg-gray-500 hover:scale-105 hover:bg-gray-700'
                : 'bg-gradient-to-r from-blue-500 to-blue-700 hover:scale-105 hover:from-blue-600 hover:to-blue-800'
            )}>
            Accounting Firm
          </Button>
        </div>

        <div className="w-full max-w-2xl">
          {isSingleCompany ? (
            <>
              <p className="my-4 text-center font-semibold italic text-gray-900">
                <span className="inline-block">
                  <span className="inline-block">
                    If you plan to use Clasibot&nbsp;
                  </span>
                  <span className="inline-block">
                    for a single company,&nbsp;
                  </span>
                </span>
                <span className="inline-block">
                  <span className="inline-block">
                    add the Clasibot bookkeeper directly&nbsp;
                  </span>
                  <span className="inline-block">as a company accountant.</span>
                </span>
              </p>
              <h3 className="mb-2 mt-6 text-center text-xl font-semibold text-black">
                Invite To Your Company
              </h3>
              <ol className="list-decimal pl-5 text-left text-gray-700">
                <li className="mb-2.5">
                  Log into your QuickBooks Online company.
                </li>
                <li className="mb-2.5">
                  Open the settings menu by clicking the gear icon in the top
                  right.
                </li>
                <li className="mb-2.5">
                  Under the&nbsp;
                  <span className="font-semibold italic">
                    Your Company&nbsp;
                  </span>
                  options, find and select&nbsp;
                  <span className="font-semibold italic">Manage users.</span>
                </li>
                <li className="mb-2.5">
                  Select&nbsp;
                  <span className="font-semibold italic">
                    Accounting Firms&nbsp;
                  </span>
                  to view your connected QuickBooks accountants.
                </li>
              </ol>

              <h4 className="mb-2 mt-6 text-center text-lg font-semibold text-black">
                Add Clasibot As First Accountant
              </h4>
              <ol className="list-decimal pl-5 text-left text-gray-700">
                <li className="mb-2.5">
                  Select the&nbsp;
                  <span className="font-semibold italic">
                    Accountant&apos;s email&nbsp;
                  </span>
                  field option next to the invite button.
                </li>
                <li className="mb-2.5">
                  Enter the email of the Clasibot bookkeeper:&nbsp;
                  <strong>bookkeeper@clasibot.com</strong>
                </li>
                <li className="mb-2.5">
                  Click the invite button to invite the Clasibot bookkeeper.
                </li>
                <li className="mb-2.5">
                  It may be necessary to enter an authorization code at this
                  step.
                </li>
                <li className="mb-2.5">
                  Send the invite and wait for the Clasibot bookkeeper to accept
                  and join your company.
                </li>
              </ol>

              <h4 className="mb-2 mt-8 text-center text-lg font-semibold text-black">
                Add Clasibot To Existing Accountant&apos;s
              </h4>
              <ol className="list-decimal pl-5 text-left text-gray-700">
                <li className="mb-2.5">
                  Select the invite button in the top right of the screen to add
                  a new accountant.
                </li>
                <li className="mb-2.5">
                  Give the Clasibot bookkeeper the name you want.
                </li>
                <li className="mb-2.5">
                  Enter the email of the Clasibot bookkeeper:&nbsp;
                  <strong>bookkeeper@clasibot.com</strong>
                </li>
                <li className="mb-6">
                  Send the invite and wait for the Clasibot accountant to accept
                  and join your company.
                </li>
              </ol>
              {showCheckConnectionButton && (
                <div className="flex flex-col items-center justify-center">
                  <CheckConnectionButton />
                </div>
              )}

              <h4 className="mb-2 mt-8 text-center text-lg font-semibold text-black">
                Connection Troubleshooting
              </h4>
              <p className="mb-4 text-gray-700">
                If the connection to the company has been deactivated, the
                Clasibot bookkeeper will not be able to connect to that company,
                even if it still has client access through QuickBooks.
              </p>
              <p className="mb-4 ml-6 mr-4 text-center text-sm text-gray-700">
                Simply delete the Clasibot bookkeeper then invite it back to
                have the Clasibot bookkeeper{' '}
                <span className="inline-block">re-activate</span> its
                connection.
              </p>
            </>
          ) : (
            <>
              <p className="my-4 text-center font-semibold italic text-gray-900">
                <span className="inline-block">
                  If you plan to use Clasibot for&nbsp;
                  <span className="inline-block">
                    multiple client companies,
                  </span>
                </span>
                <span className="inline-block">
                  <span className="inline-block">
                    add the Clasibot bookkeeper&nbsp;
                  </span>
                  <span className="inline-block">
                    to your accounting company.
                  </span>
                </span>
              </p>
              <h3 className="mb-2 mt-6 text-center text-xl font-semibold text-black">
                Invite To Accountant Company
              </h3>
              <ol className="list-decimal pl-5 text-left text-gray-700">
                <li className="mb-2.5">
                  Log into your QuickBooks Online accountant company.
                </li>
                <li className="mb-2.5">
                  Open the settings menu by clicking the gear icon in the top
                  right.
                </li>
                <li className="mb-2.5">
                  Under the&nbsp;
                  <span className="font-semibold italic">
                    Your Company&nbsp;
                  </span>
                  options, find and select&nbsp;
                  <span className="font-semibold italic">Your team.</span>
                </li>
                <li className="mb-2.5">
                  Check the top to ensure you are under the&nbsp;
                  <span className="font-semibold italic">Users&nbsp;</span>
                  tab.
                </li>
              </ol>

              <h4 className="mb-2 mt-6 text-center text-lg font-semibold text-black">
                Invite To Your Accountant Company
              </h4>
              <ol className="list-decimal pl-5 text-left text-gray-700">
                <li className="mb-2.5">
                  Select&nbsp;
                  <span className="font-semibold italic">Add user&nbsp;</span>
                  to start adding the Clasibot bookkeeper to your accounting
                  team.
                </li>
                <li className="mb-2.5">
                  Give the Clasibot bookkeeper the name you want.
                </li>
                <li className="mb-2.5">
                  Enter the email of the Clasibot bookkeeper:&nbsp;
                  <strong>bookkeeper@clasibot.com</strong>
                </li>
                <li className="mb-2.5">
                  Select the&nbsp;
                  <span className="font-semibold italic">
                    Standard no access&nbsp;
                  </span>
                  option for Clasibot&apos;s permissions.
                </li>
                <li className="mb-2.5">
                  Send the invite and wait for the Clasibot accountant to accept
                  and join your accounting firm.
                </li>
              </ol>

              <h4 className="mb-2 mt-6 text-center text-lg font-semibold text-black">
                Check If The Invite Was Accepted
              </h4>
              <ol className="list-decimal pl-5 text-left text-gray-700">
                <li className="mb-2.5">
                  Wait a few minutes for Clasibot to receive and accept your
                  invite.
                </li>
                <li className="mb-2.5">
                  Find the user with the&nbsp;
                  <strong>bookkeeper@clasibot.com</strong> email and the name
                  you chose to give the Clasibot bookkeeper.
                </li>
                <li className="mb-2.5">
                  Check that the invite has been accepted by looking under the
                  status column.
                </li>
                <li className="mb-2.5">
                  If the value says&nbsp;
                  <span className="font-semibold italic">Active&nbsp;</span>
                  you are ready to continue.
                </li>
                <li className="mb-2.5">
                  If the value still says&nbsp;
                  <span className="font-semibold italic">Invited&nbsp;</span>,
                  try refreshing the page.
                </li>
              </ol>

              <h4 className="mb-2 mt-6 text-center text-lg font-semibold text-black">
                Grant Access To Client Companies
              </h4>
              <ol className="list-decimal pl-5 text-left text-gray-700">
                <li className="mb-2.5">
                  Select the edit option for the Clasibot bookkeeper.
                </li>
                <li className="mb-2.5">
                  Scroll down to the section labeled
                  <span className="font-semibold italic">
                    Access to clients&nbsp;
                  </span>
                  and open the&nbsp;
                  <span className="font-semibold italic">
                    Edit client access&nbsp;
                  </span>
                  dropdown.
                </li>
                <li className="mb-2.5">
                  Select the client you are presently logged in as to grant the
                  Clasibot bookkeeper access.
                </li>
                <li className="mb-6">
                  Click save changes and wait for the Clasibot bookkeeper to
                  update its connection to your client&apos;s company.
                </li>
              </ol>

              {showCheckConnectionButton && (
                <div className="flex flex-col items-center justify-center">
                  <CheckConnectionButton />
                </div>
              )}

              <div className="px-4 md:px-0">
                <h4 className="mb-2 mt-6 text-center text-lg font-semibold text-black">
                  Connection Troubleshooting
                </h4>
                <p className="mb-4 text-gray-700">
                  Ensure that you have logged into Clasibot as the client before
                  granting the bookkeeper access. It will accept access to any
                  companies that have not been authenticated through logging
                  into the Clasibot application.
                </p>
                <p className="mb-4 ml-6 mr-4 text-center text-sm text-gray-700">
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
                <p className="ml-6 mr-4 text-center text-sm text-gray-700">
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
