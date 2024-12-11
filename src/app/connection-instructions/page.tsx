import { getServerSession } from 'next-auth';

import ConnectionInstructions from '@/components/check-pages/connection-instructions';

export default async function Page() {
  // Check for a user session and set the check connection button to be shown if it is found.
  const session = await getServerSession();
  let showCheckConnectionButton = false;
  if (session) {
    showCheckConnectionButton = true;
  }

  return (
    <ConnectionInstructions
      showCheckConnectionButton={showCheckConnectionButton}
    />
  );
}
