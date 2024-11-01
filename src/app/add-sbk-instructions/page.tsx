import AddSBKInstructions from '@/components/halt-elements/add-sbk-instructions';
import { getServerSession } from 'next-auth';

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
