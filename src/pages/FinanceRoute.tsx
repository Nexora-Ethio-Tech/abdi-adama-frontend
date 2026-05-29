import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Finance } from './Finance';
import { AuditorFinance } from './AuditorFinance';

/** Routes super-admin to group finance; auditors to auditor finance workspace. */
export const FinanceRoute = () => {
  const { role } = useUser();

  if (role === 'auditor') {
    return <AuditorFinance />;
  }

  if (role === 'super-admin') {
    return <Finance />;
  }

  return <Navigate to="/" replace />;
};
