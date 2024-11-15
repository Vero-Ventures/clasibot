'use client';

import { Button } from '@/components/ui/button';

export function BackendClassifyErrorNotice({
  showErrorNotification,
  dismissalMessage,
  dismissBackendClassifyErrorStatus,
  setShowErrorNotification,
}: Readonly<{
  showErrorNotification: boolean;
  dismissalMessage: string;
  dismissBackendClassifyErrorStatus: () => void;
  setShowErrorNotification: (newState: boolean) => void;
}>) {
  return <div className=""></div>;
}
