'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import styles from './AdminLogin.module.css'

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

      // Only allow login for staff and superadmin roles
      if (roleData.role !== 'staff' && roleData.role !== 'superadmin') {
        throw new Error('오류')
      }

      // Redirect based on user role
      switch(roleData.role) {
        case 'superadmin':
        case 'staff':
          router.push('/admin/dashboard')
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
      <h1 className={styles.title}>관리자 로그인</h1>
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
    </div>
  )
}
