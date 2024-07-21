import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies })

  // 세션 확인
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 현재 로그인한 사용자의 ID와 요청된 강사 ID 비교
  if (session.user.id !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // 강사 정보 가져오기
    const { data: instructor, error } = await supabase
      .from('instructors')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) throw error

    return NextResponse.json(instructor)
  } catch (error) {
    console.error('Error fetching instructor:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}