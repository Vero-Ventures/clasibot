import { getServerSession } from 'next-auth';

import ConnectionInstructions from '@/components/check-pages/connection-instructions';

export default async function Page() {
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
