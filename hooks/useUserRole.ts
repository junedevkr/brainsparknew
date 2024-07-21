import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useState, useEffect } from 'react';
import { UserRole } from '../utils/auth';

export function useUserRole() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchUserRole() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
        } else {
          setUserRole((data?.role as UserRole) || 'Ordinary');
        }
      }
    }

    fetchUserRole();
  }, []);

  return userRole;
}