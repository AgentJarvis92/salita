import { redirect } from 'next/navigation';

export default function Home() {
  // Direct redirect to dashboard - middleware will handle auth
  redirect('/dashboard');
}
