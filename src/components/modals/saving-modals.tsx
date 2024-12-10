import { MiniSpinner } from '@/components/loading-elements/index';

interface SaveProgressProps {
  displayState: boolean;
}

// Takes: The modal display state.
export const SaveProcessModal: React.FC<SaveProgressProps> = ({
  displayState,
}: SaveProgressProps) => {
  return (
    <>
      {
        <div
          className={`fixed left-0 top-0 flex h-full w-full items-center justify-center bg-gray-900 bg-opacity-50 ${displayState ? '' : 'hidden'}`}>
          <div className="mx-4 flex w-96 flex-col space-y-4 rounded-lg bg-white p-6 mb:w-[416px] sm:w-[448px]">
            <p className="mt-2 px-2 text-center text-lg font-semibold text-gray-800 mb:text-xl">
              Updating QuickBooks Online
            </p>
            <MiniSpinner success={null} />
          </div>
        </div>
      }
    </>
  );
};
