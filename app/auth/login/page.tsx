'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import styles from './Login.module.css'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Fetch user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (roleError) throw roleError

      // Only allow login for instructor and user roles
      if (roleData.role !== 'instructor' && roleData.role !== 'user') {
        throw new Error('인증받은 강사 아이디만 로그인할 수 있습니다.')
      }

      // Redirect based on user role
      switch(roleData.role) {
        case 'instructor':
          router.push('/instructor/dashboard')
          break
        case 'user':
          router.push('/user/dashboard')
          break
        default:
          router.push('/')
      }

    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('An unknown error occurred')
      }
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>강사 로그인</h1>
      <form onSubmit={handleLogin} className={styles.form}>
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
        <button type="submit" className={styles.button}>로그인</button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
      <p className={styles.switchLink}>
        계정이 없으신가요? <Link href="/auth/signup">회원가입</Link>
      </p>
    </div>
  )
}
