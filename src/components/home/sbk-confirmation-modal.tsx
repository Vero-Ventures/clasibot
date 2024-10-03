import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SBKConfirmationModal() {

    const functionToCheckIfSBKExists = () => {
      return true;
    };

    const modal = functionToCheckIfSBKExists();

    return (
      <div
        className={`fixed left-0 top-0 flex h-full w-full items-center justify-center bg-gray-900 bg-opacity-50 ${modal ? '' : 'hidden'}`}>
        <div className="mx-4 flex w-96 flex-col rounded-lg bg-white p-6">
          <h2
            id="ResultTitle"
            className="mb-4 text-center text-2xl font-bold text-red-500">
            Unable to Proceed
          </h2>
          <p
            id="ResultMessage"
            className="mb-6 text-center font-medium text-gray-800">
            {`Clasibot hasn't been added to your company yet, so you can't
              proceed. If you've already followed the instructions to add Clasibot, please
              wait—we're confirming in the background, and the screen will
              update automatically once it's done. If you haven't added
              Clasibot, click 'Go to Instructions' below. Clasibot needs access
              to your QuickBooks transactions to function properly.`}
          </p>
          <Button>
            <Link id="AddSBKInstructionsPageLink" href="/test">
              Go To Instructions
            </Link>
          </Button>
        </div>
      </div>
    );
}