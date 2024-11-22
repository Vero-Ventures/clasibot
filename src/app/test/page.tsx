import { DeactivationButton } from '@/components/inputs/index';

export default async function Page() {
  return (
    <div className={`hidden pl-4 pr-2 md:mt-6 md:block`}>
      <DeactivationButton connectionStatus={true} />
    </div>
  );
}
