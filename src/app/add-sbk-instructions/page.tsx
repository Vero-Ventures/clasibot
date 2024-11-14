import { getServerSession } from 'next-auth';

import AddSBKInstructions from '@/components/check-pages/add-sbk-instructions';

export default async function Page() {
  const session = await getServerSession();
  let showCheckConnectionButton = false;
  if (session) {
    showCheckConnectionButton = true;
  }

  return (
    <AddSBKInstructions showCheckConnectionButton={showCheckConnectionButton} />
  );
}
