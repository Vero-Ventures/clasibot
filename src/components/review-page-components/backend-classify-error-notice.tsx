'use client';

import { Button } from '@/components/ui/button';

export function BackendClassifyErrorNotice({
  showErrorNotice,
  dismissalMessage,
  dismissErrorStatus,
  setShowErrorNotice,
}: Readonly<{
  showErrorNotice: boolean;
  dismissalMessage: string;
  dismissErrorStatus: () => void;
  setShowErrorNotice: (newState: boolean) => void;
}>) {
  // Test value setting.
  showErrorNotice = true;
  dismissalMessage = '';

  return (
    <div className={`${showErrorNotice ? '' : 'hidden'}`}>
      <div className="">
        <p className="">Inital Message</p>
        <p className="">Secondary Message</p>
      </div>
      <h3 className={`${dismissalMessage !== '' ? '' : 'hidden'}`}>
        {dismissalMessage}
      </h3>
      <div className="">
        <Button onClick={() => setShowErrorNotice(false)} className=""></Button>
        <Button onClick={() => dismissErrorStatus()} className=""></Button>
      </div>
    </div>
  );
}
