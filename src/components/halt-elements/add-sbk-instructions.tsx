'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import clsx from 'clsx';
import CheckConnectionButton from '../inputs/check-connection-button';

export default function AddSBKInstructions() {
  const [isSingleCompany, setIsSingleCompany] = useState(true);

  return (
    <section className="m-8 transform rounded-lg bg-white px-8 py-10 shadow-lg">
      <div className="flex flex-col items-center justify-center p-4">
        <h1 className="mb-4 text-center text-4xl font-bold text-black">
          Add Clasibot to your QuickBooks Organization now!
        </h1>
        <h2 className="mb-6 text-center text-lg text-gray-700">
          Are you a single company or an accounting firm?
        </h2>
        <div className="mb-6 flex w-full justify-center space-x-5">
          <Button
            onClick={() => setIsSingleCompany(true)}
            className={clsx(
              'w-full transform rounded-lg px-6 py-3 text-white shadow-md transition-transform duration-300 md:w-auto',
              isSingleCompany
                ? 'bg-gradient-to-r from-blue-500 to-blue-700 hover:scale-105 hover:from-blue-600 hover:to-blue-800'
                : 'bg-gray-500 hover:scale-105 hover:bg-gray-700'
            )}>
            Single Company
          </Button>
          <Button
            onClick={() => setIsSingleCompany(false)}
            className={clsx(
              'w-full transform rounded-lg px-6 py-3 text-white shadow-md transition-transform duration-300 md:w-auto',
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
              <h3 className="mb-2 mt-6 text-xl font-semibold text-black">
                Invite As Company
              </h3>
              <p className="mb-4 text-gray-700">
                If you plan to use Clasibot for a singular company, add the
                Clasibot bookkeeper directly as an accountant.
              </p>
              <ol className="list-decimal pl-5 text-left text-gray-700">
                <li className="mb-2.5">
                  Log into your QuickBooks Online company.
                </li>
                <li className="mb-2.5">
                  Open the settings menu by clicking the gear icon in the top
                  right.
                </li>
                <li className="mb-2.5">
                  Under the “Your Company” options, find and select “Manage
                  users”.
                </li>
                <li className="mb-2.5">
                  Select “Accounting Firms” to view your connected QuickBooks
                  accountants.
                </li>
              </ol>

              <h4 className="mb-2 mt-6 text-lg font-semibold text-black">
                Add With No Accountants
              </h4>
              <ol className="list-decimal pl-5 text-left text-gray-700">
                <li className="mb-2.5">
                  Select the ‘Accountant’s email’ field option next to the
                  invite button.
                </li>
                <li className="mb-2.5">
                  Enter the email of the Clasibot bookkeeper:{' '}
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

              <h4 className="mb-2 mt-6 text-lg font-semibold text-black">
                Add To Existing Accountants
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
                  Enter the email of the Clasibot bookkeeper:{' '}
                  <strong>bookkeeper@clasibot.com</strong>
                </li>
                <li className="mb-6">
                  Send the invite and wait for the Clasibot accountant to accept
                  and join your company.
                </li>
              </ol>
              <div className="flex flex-col items-center justify-center">
                <CheckConnectionButton />
              </div>

              <h4 className="mb-2 mt-6 text-lg font-semibold text-black">
                Connection Issue Troubleshooting
              </h4>
              <p className="mb-4 text-gray-700">
                If the connection to the company has been deactivated, the
                Clasibot bookkeeper will not be able to connect to that company,
                even if it still has client access through QuickBooks.
              </p>
              <p className="mb-4 text-gray-700">
                Simply delete the Clasibot bookkeeper then invite it back to
                have the Clasibot bookkeeper re-activate its connection.
              </p>
            </>
          ) : (
            <>
              <h3 className="mb-2 mt-6 text-xl font-semibold text-black">
                Invite As Accountant
              </h3>
              <p className="mb-4 text-gray-700">
                If you plan to use Clasibot for multiple client companies, add
                the Clasibot bookkeeper to your accounting company and grant it
                access to the clients you want it to review.
              </p>
              <ol className="list-decimal pl-5 text-left text-gray-700">
                <li className="mb-2.5">
                  Log into your QuickBooks Online accountant company.
                </li>
                <li className="mb-2.5">
                  Open the settings menu by clicking the gear icon in the top
                  right.
                </li>
                <li className="mb-2.5">
                  Under the “Your Company” options, find and select “Your team”.
                </li>
                <li className="mb-2.5">
                  Check the top to ensure you are under the “Users” tab.
                </li>
              </ol>

              <h4 className="mb-2 mt-6 text-lg font-semibold text-black">
                Invite To Company
              </h4>
              <ol className="list-decimal pl-5 text-left text-gray-700">
                <li className="mb-2.5">
                  Select “Add user” to start adding the Clasibot bookkeeper to
                  your accounting team.
                </li>
                <li className="mb-2.5">
                  Give the Clasibot bookkeeper the name you want.
                </li>
                <li className="mb-2.5">
                  Enter the email of the Clasibot bookkeeper:{' '}
                  <strong>bookkeeper@clasibot.com</strong>
                </li>
                <li className="mb-2.5">
                  Select the “Standard no access” option for Clasibot’s
                  permissions.
                </li>
                <li className="mb-2.5">
                  Send the invite and wait for the Clasibot accountant to accept
                  and join your accounting firm.
                </li>
              </ol>

              <h4 className="mb-2 mt-6 text-lg font-semibold text-black">
                Check that the Invite Has Been Accepted
              </h4>
              <ol className="list-decimal pl-5 text-left text-gray-700">
                <li className="mb-2.5">
                  Wait a few minutes for Clasibot to receive and accept your
                  invite.
                </li>
                <li className="mb-2.5">
                  Find the user with the{' '}
                  <strong>bookkeeper@clasibot.com</strong> email and the name
                  you chose to give the Clasibot bookkeeper.
                </li>
                <li className="mb-2.5">
                  Check that the invite has been accepted by looking under the
                  status column.
                </li>
                <li className="mb-2.5">
                  If the value says “Active” you are ready to continue.
                </li>
                <li className="mb-2.5">
                  If the value still says “Invited”, try refreshing the page.
                </li>
              </ol>

              <h4 className="mb-2 mt-6 text-lg font-semibold text-black">
                Grant Client Access
              </h4>
              <ol className="list-decimal pl-5 text-left text-gray-700">
                <li className="mb-2.5">
                  Select the edit option for the Clasibot bookkeeper.
                </li>
                <li className="mb-2.5">
                  Scroll down to the section labeled “Access to clients” and
                  open the “Edit client access” dropdown.
                </li>
                <li className="mb-2.5">
                  Select the client you are presently logged in as to grant the
                  Clasibot bookkeeper access.
                </li>
                <li className="mb-6">
                  Click save changes and wait for the Clasibot bookkeeper to
                  update its connection to your client’s company.
                </li>
              </ol>

              <div className="flex flex-col items-center justify-center">
                <CheckConnectionButton />
              </div>

              <h4 className="mb-2 mt-6 text-lg font-semibold text-black">
                Connection Issue Troubleshooting
              </h4>
              <p className="mb-4 text-gray-700">
                Ensure that you have logged into Clasibot as the client before
                granting the bookkeeper access. It will accept access to any
                companies that have not been authenticated through logging into
                the Clasibot application.
              </p>
              <p className="mb-4 text-gray-700">
                If access has already been granted, simply edit the Clasibot
                bookkeeper to remove the access, log in to the client company,
                then re-grant the client access.
              </p>
              <p className="mb-4 text-gray-700">
                If the connection to the client company has been deactivated,
                the Clasibot bookkeeper will not be able to connect to that
                company, even if it still has client access through QuickBooks.
              </p>
              <p className="mb-4 text-gray-700">
                Simply edit the Clasibot bookkeeper to remove the access then
                re-grant it to have the Clasibot bookkeeper re-activate its
                connection.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
