'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import styles from './Inquiry.module.css'

export default function InquiryPage() {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    startDate: '',
    endDate: '',
    time: '',
    classType: '',
    targetAudience: '',
    institution: '',
    content: '',
    singleDay: false
  })

  const supabase = createClientComponentClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement
      setFormData({ ...formData, [name]: checked })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { clientName, clientEmail, clientPhone, startDate, endDate, time, classType, targetAudience, institution, content } = formData
    
    const { error } = await supabase.from('inquiries').insert([
      {
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        start_date: startDate,
        end_date: formData.singleDay ? null : endDate,
        time: time,
        class_type: classType,
        target_audience: targetAudience,
        institution: institution,
        content: content,
        created_at: new Date().toISOString() // 한국 시간을 기준으로 타임스탬프 저장
      }
    ])

    if (error) {
      console.error('Error inserting data:', error)
    } else {
      alert('문의가 성공적으로 제출되었습니다.')
      // 폼 초기화
      setFormData({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        startDate: '',
        endDate: '',
        time: '',
        classType: '',
        targetAudience: '',
        institution: '',
        content: '',
        singleDay: false
      })
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>수업 문의 및 견적 요청</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          <label className={styles.label}>이름:</label>
          <input type="text" name="clientName" value={formData.clientName} onChange={handleChange} className={styles.input} required />
        </div>
        <div className={styles.formRow}>
          <label className={styles.label}>이메일:</label>
          <input type="email" name="clientEmail" value={formData.clientEmail} onChange={handleChange} className={styles.input} required />
        </div>
        <div className={styles.formRow}>
          <label className={styles.label}>연락처:</label>
          <input type="tel" name="clientPhone" value={formData.clientPhone} onChange={handleChange} className={styles.input} required />
        </div>
        <div className={styles.formRow}>
          <label className={styles.label}>대상:</label>
          <input type="text" name="targetAudience" value={formData.targetAudience} onChange={handleChange} className={styles.input} required />
        </div>
        <div className={styles.formRow}>
          <label className={styles.label}>학교이름/기관명:</label>
          <input type="text" name="institution" value={formData.institution} onChange={handleChange} className={styles.input} required />
        </div>
        <div className={styles.formRow}>
          <label className={styles.label}>희망일자(시작일):</label>
          <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className={styles.input} required />
          <label className={styles.label} style={{ marginLeft: '10px' }}>하루만:</label>
          <input type="checkbox" name="singleDay" checked={formData.singleDay} onChange={handleChange} />
        </div>
        <div className={styles.formRow}>
          <label className={styles.label}>종료일자:</label>
          <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className={styles.input} disabled={formData.singleDay} />
        </div>
        <div className={styles.formRow}>
          <label className={styles.label}>시간:</label>
          <input type="text" name="time" value={formData.time} onChange={handleChange} className={styles.input} required />
        </div>
        <div className={styles.formRow}>
          <label className={styles.label}>수업 종류:</label>
          <select name="classType" value={formData.classType} onChange={handleChange} className={styles.input} required>
            <option value="">선택하세요</option>
            <option value="선택1">선택1</option>
            <option value="선택2">선택2</option>
            <option value="선택3">선택3</option>
          </select>
        </div>
        <div className={styles.textareaRow}>
          <label className={styles.textareaLabel}>자세한 내용:</label>
          <textarea name="content" value={formData.content} onChange={handleChange} className={styles.textarea} required />
        </div>
        <button type="submit" className={styles.button}>문의하기</button>
      </form>
    </div>
  )
}
