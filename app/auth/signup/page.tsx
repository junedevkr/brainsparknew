'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import styles from './Signup.module.css';
import Link from 'next/link';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    console.log('Sign up initiated');
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          }
        }
      });

      if (error) throw error;

      console.log('User created:', data.user);

      if (data.user) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({ id: data.user.id, role: 'user' }, { onConflict: 'id' });

        if (roleError) throw roleError;

        alert('회원가입이 완료되었습니다. 이메일 인증 후 로그인해주세요.');
        router.push('/auth/login');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error during sign up:', error.message);
        setError(error.message);
      } else {
        console.error('An unknown error occurred during sign up');
        setError('An unknown error occurred during sign up');
      }
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>강사 회원가입</h1>
      <form onSubmit={handleSignUp} className={styles.form}>
        <input
          className={styles.input}
          type="text"
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className={styles.input}
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className={styles.input}
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className={styles.button}>회원가입</button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
      <p className={styles.switchLink}>
        이미 계정이 있으신가요? <Link href="/auth/login">로그인</Link>
      </p>
    </div>
  );
}

