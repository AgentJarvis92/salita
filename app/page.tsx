import { redirect } from 'next/navigation';

export default function Home() {
  // Let middleware handle auth redirect
  redirect('/login');
}
