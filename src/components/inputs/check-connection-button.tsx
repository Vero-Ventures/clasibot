'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MiniSpinner } from '@/components/loading/index';
import { checkCompanyConnection } from '@/actions/user-company/index';

export const CheckConnectionButton = () => {
  const [checkingForSBK, setCheckingForSBK] = useState(false);
  const [sbkExists, setSbkExists] = useState<boolean | null>(null);
  const [displayFailMessage, setDisplayFailMessage] = useState<boolean>(false);
  const router = useRouter();

  const handleCheckConnection = async () => {
    setCheckingForSBK(true);
    const sbkExists = await checkCompanyConnection();
    setSbkExists(sbkExists.connected);
    setCheckingForSBK(false);

    if (sbkExists.connected) {
      // Optional: Wait for the animation to complete before redirecting
      setTimeout(() => {
        router.push('/home');
      }, 2000); // Adjust the delay as needed
    } else {
      // Handle failure case if needed
      setDisplayFailMessage(true);
      setTimeout(() => {
        setSbkExists(null);
        setDisplayFailMessage(false);
      }, 3000);
    }
  };

  return (
    <>
      <Button
        id="CheckConnection"
        className="w-full transform rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 px-6 py-3 text-white shadow-md transition-transform duration-300 hover:scale-105 hover:from-blue-600 hover:to-blue-800"
        onClick={handleCheckConnection}
        disabled={checkingForSBK}>
        Check Connection
      </Button>
      {(checkingForSBK || sbkExists !== null) && (
        <div>
          <MiniSpinner sbkExists={sbkExists} />
          {displayFailMessage && (
            <p>
              Connection failed, try again. See troubleshooting solutions below.
            </p>
          )}
        </div>
      )}
    </>
  );
};
