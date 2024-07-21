import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export type UserRole = 'superadmin' | 'staff' | 'instructor' | 'user' | 'Ordinary';

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const supabase = createServerComponentClient({ cookies });
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user role:', error);
    return null;
  }

  return (data?.role as UserRole) || 'user';
}