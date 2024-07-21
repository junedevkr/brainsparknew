'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import styles from './AdminLogin.module.css'

export default function AdminLogin() {
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

      // 사용자 역할 확인
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (roleError) throw roleError

      if (roleData.role !== 'SuperAdmin' && roleData.role !== 'Staff') {
        throw new Error('관리자 권한이 없습니다.')
      }

      router.push('/admin/dashboard')
    } catch (error: unknown) {  // <- 여기서 error를 명시적으로 unknown 타입으로 지정
      if (error instanceof Error) {  // <- error가 Error 타입인지 확인
        setError(error.message)
      } else {
        setError('An unknown error occurred')  // <- 일반적인 오류 메시지 설정
      }
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>관리자 로그인</h1>
      <form onSubmit={handleLogin} className={styles.form}>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={styles.input}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={styles.input}
        />
        <button type="submit" className={styles.button}>로그인</button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}