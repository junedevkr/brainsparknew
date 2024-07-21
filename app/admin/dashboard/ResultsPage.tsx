'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import styles from './Dashboard.module.css'

export default function ResultsPage() {
  const supabase = createClientComponentClient()
  const [classes, setClasses] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [classEvaluations, setClassEvaluations] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    let { data: classesData } = await supabase.from('classes').select('*')
    let { data: paymentsData } = await supabase.from('payments').select('*')
    let { data: classEvaluationsData } = await supabase.from('class_evaluations').select('*')

    if (classesData) setClasses(classesData)
    if (paymentsData) setPayments(paymentsData)
    if (classEvaluationsData) setClassEvaluations(classEvaluationsData)
  }

  const handleUpdate = async (table: string, id: string, data: any) => {
    const { error } = await supabase.from(table).update(data).eq('id', id)
    if (error) {
      console.error('Error updating data:', error)
    } else {
      fetchData()
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const hh = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`
  }

  const renderTable = (data: any[], table: string) => (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            {Object.keys(data[0] || {}).map((key) => (
              <th key={key} className={styles.th}>{key}</th>
            ))}
            <th className={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              {Object.entries(row).map(([key, value], index) => (
                <td key={index} className={styles.td}>
                {key.includes('date') || key.includes('created_at') 
                  ? formatDateTime(value as string) 
                  : String(value)}
              </td>
              ))}
              <td className={styles.td}>
                <button className={styles.button} onClick={() => handleUpdate(table, row.id, { ...row, someField: 'newValue' })}>
                  Update
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>수업 정산 및 결과</h2>
      {renderTable(classes, 'classes')}
      {renderTable(payments, 'payments')}
      {renderTable(classEvaluations, 'class_evaluations')}
    </div>
  )
}
