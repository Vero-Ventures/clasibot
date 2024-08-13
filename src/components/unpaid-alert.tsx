import { HiOutlineExclamation } from 'react-icons/hi';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function UnpaidAlert() {
  return (
    // Define an alert with a warning icon, title, and description.
    // Alert informs users the app is non-functional without a subscription.
    <Alert variant="destructive" className="mb-2">
      <HiOutlineExclamation size={20} />
      <AlertTitle>Notice</AlertTitle>
      <AlertDescription>
        Transaction classification will not work until you pay for the
        subscription.
      </AlertDescription>
    </Alert>
  );
}
