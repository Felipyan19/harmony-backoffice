import { redirect } from 'next/navigation';

export default function RolesPage() {
  redirect('/usuarios?tab=roles');
}
