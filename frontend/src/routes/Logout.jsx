import { redirect } from 'react-router-dom';
import { clearSession } from '../lib/session';

export async function logoutAction() {
  clearSession();
  return redirect('/login');
}
