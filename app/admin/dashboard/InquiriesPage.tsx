import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import styles from './Dashboard.module.css'
import { useRouter } from 'next/router'

const statusColors: { [key: string]: string } = {
    '문의 및 접수': 'statusBlue',
    '진행중': 'statusYellow',
    '확정': 'statusGreen',
    '취소': 'statusRed',
    '종료': 'statusGray'
  };

  
export const columnConfig = [
    { key: 'no', title: 'No' },
    { key: 'status', title: '진행 여부' },
    { key: 'client_name', title: '고객명' },
    { key: 'client_email', title: '이메일' },
    { key: 'client_phone', title: '연락처' },
    { key: 'start_date', title: '시작일' },
    { key: 'end_date', title: '종료일' },
    { key: 'single_day', title: '당일' },
    { key: 'time', title: '시간' },
    { key: 'class_type', title: '수업 유형' },
    { key: 'target_audience', title: '대상' },
    { key: 'location', title: '지역' },
    { key: 'institution', title: '학교/기관' },
    { key: 'content', title: '내용' },
    { key: 'created_at', title: '생성일' },
    { key: 'updated_at', title: '수정일' },
  ]
  

export default function InquiriesPage() {
  const supabase = createClientComponentClient()
  const [inquiries, setInquiries] = useState<any[]>([])
  const [editingField, setEditingField] = useState<{ id: string, key: string } | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [history, setHistory] = useState<{ id: string, key: string, oldValue: string, newValue: string }[]>([])
  const [selectedHistory, setSelectedHistory] = useState<any | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [popupPosition, setPopupPosition] = useState<{ x: number, y: number } | null>(null)
  const [selectedNotes, setSelectedNotes] = useState<{ id: string, content: string, notes: string } | null>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const [filter, setFilter] = useState<string>('')
  const [newRowId, setNewRowId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    let { data: inquiriesData } = await supabase.from('inquiries').select('*').order('no', { ascending: false })
    if (inquiriesData) setInquiries(inquiriesData)

    const { data: historyData } = await supabase.from('inquiries_history').select('*')
    if (historyData) {
      const mappedHistory = historyData.map((entry: any) => ({
        id: entry.inquiry_id,
        key: entry.field_name,
        oldValue: entry.old_value,
        newValue: entry.new_value
      }))
      setHistory(mappedHistory)
    }
  }

  const handleUpdate = async (id: string, key: string, value: any) => {
    const inquiry = inquiries.find(inquiry => inquiry.id === id)
    const oldValue = inquiry[key]
  
    if (oldValue !== value) {
      await supabase.from('inquiries_history').insert({
        inquiry_id: id,
        field_name: key,
        old_value: oldValue,
        new_value: value,
        updated_at: new Date().toISOString()
      })
  
      const updateData = key === 'single_day' && value === 'true' ? { [key]: value, end_date: null } : { [key]: value }
  
      const { error } = await supabase.from('inquiries').update(updateData).eq('id', id)
      if (error) {
        console.error('Error updating data:', error)
      } else {
        fetchData()
        setEditingField(null)
      }
    }
  }
  
  
  const handleCellClick = (id: string, key: string, value: string) => {
    if (key !== 'created_at' && key !== 'updated_at') {
      setEditingField({ id, key })
      setEditValue(value)
    }
  }

  const handleSave = () => {
    if (editingField) {
      handleUpdate(editingField.id, editingField.key, editValue)
    }
  }

  const handleHistoryClick = async (inquiry_id: string, field_name: string, x: number, y: number) => {
    const { data } = await supabase.from('inquiries_history').select('*').eq('inquiry_id', inquiry_id).eq('field_name', field_name).order('updated_at', { ascending: false })
    setSelectedHistory(data)
    setPopupPosition({ x, y })
    setShowPopup(true)
  }

  const handleNotesClick = (id: string, content: string, notes: string, x: number, y: number) => {
    setSelectedNotes({ id, content, notes })
    setPopupPosition({ x, y })
    setShowPopup(true)
  }

  const closePopup = () => {
    setShowPopup(false)
    setSelectedHistory(null)
    setSelectedNotes(null)
    setPopupPosition(null)
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

  const handleOutsideClick = (event: MouseEvent) => {
    if (!event.target) return;
    if (editingField && tableRef.current && !tableRef.current.contains(event.target as Node)) {
      handleSave();
    }
    if (showPopup && (event.target as HTMLElement).closest) {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.popup}`)) {
        closePopup();
      }
    }
  };
  
  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      handleSave()
      if (event.key === 'Tab') {
        const currentColumnIndex = columnConfig.findIndex(column => column.key === editingField?.key)
        const nextColumnKey = columnConfig[(currentColumnIndex + 1) % columnConfig.length].key
        setEditingField({ id: editingField!.id, key: nextColumnKey })
        setEditValue(inquiries.find(inquiry => inquiry.id === editingField!.id)[nextColumnKey])
      }
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [editingField, editValue, showPopup])
  const handleAddNewInquiry = async () => {
    const { data: maxNo } = await supabase.from('inquiries').select('no').order('no', { ascending: false }).limit(1)
    const newNo = maxNo && maxNo.length > 0 ? maxNo[0].no + 1 : 1
  
    const newInquiry = {
      no: newNo,
      client_name: '신규 고객명',
      client_email: 'example@example.com',
      client_phone: '010-0000-0000',
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      single_day: false,
      time: '1시간',
      class_type: '수업 유형',
      target_audience: ' 대상',
      institution: '학교/기관',
      location: '지역', // 추가된 필드
      content: '내용',
      status: '문의 및 접수',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      hidden: false
    }
  
    const { data, error } = await supabase.from('inquiries').insert([newInquiry]).select()
  
    if (error) {
      console.error('Error adding new inquiry:', error)
    } else {
      setNewRowId(data[0].id)
      setInquiries([data[0], ...inquiries])
    }
  }
  
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('inquiries').update({ hidden: true }).eq('id', id)
    if (error) {
      console.error('Error hiding data:', error)
    } else {
      fetchData()
    }
  }
  const handleRowClick = (id: string) => {
    window.open(`/inquiry/${id}`, '_blank')
  }
  
  const renderPopup = () => (
    <div className={styles.overlay}>
      <div className={styles.popup} style={{ top: popupPosition?.y, left: popupPosition?.x }}>
        {selectedNotes ? (
          <>
            <h3>내용 및 메모</h3>
            <div>
              <div>
                <h4>Content</h4>
                <p>{selectedNotes.content}</p>
              </div>
              <div>
                <h4>Notes</h4>
                <textarea
                  value={selectedNotes.notes}
                  onChange={(e) => setSelectedNotes({ ...selectedNotes, notes: e.target.value })}
                />
              </div>
              <button className={styles.button} onClick={() => handleUpdate(selectedNotes.id, 'notes', selectedNotes.notes)}>
                Save
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>수정 내역</h3>
            {selectedHistory && selectedHistory.map((entry: any) => (
              <div key={entry.id}>
              <p>{formatDateTime(entry.updated_at)}: {entry.old_value} &gt; {entry.new_value}</p>              </div>
            ))}
          </>
        )}
        <button className={styles.button} onClick={closePopup}>Close</button>
      </div>
    </div>
  )

  const renderTable = () => (
    <div className={styles.tableContainer}>
      <table className={`${styles.table} ${styles.resizable}`} ref={tableRef}>
        <thead>
          <tr>
            {columnConfig.map((column) => (
              <th key={column.key} className={styles.th}>
                {column.title}
              </th>
            ))}
            <th className={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {inquiries
            .filter(row => !row.hidden && columnConfig.some(column => row[column.key]?.toString().includes(filter)))
            .map((row, index) => (
              <tr key={row.id}>
                {columnConfig.map((column) => (
                  <td key={column.key} className={`${styles.td} ${column.key === 'status' ? styles[statusColors[row[column.key]]] : ''}`}>
                    <div className={styles.inline}>
                      {column.key === 'status' ? (
                        <select 
                          className={`${styles.statusSelect} ${styles[statusColors[row.status]]}`}
                          value={row[column.key]} 
                          onChange={(e) => handleUpdate(row.id, column.key, e.target.value)}
                        >
                          <option value="문의 및 접수">문의 및 접수</option>
                          <option value="진행중">진행중</option>
                          <option value="확정">확정</option>
                          <option value="취소">취소</option>
                          <option value="종료">종료</option>
                        </select>
                      ) : column.key === 'single_day' ? (
                        <input
                          type="checkbox"
                          checked={row[column.key]}
                          onChange={(e) => {
                            const isChecked = e.target.checked ? 'true' : 'false';
                            handleUpdate(row.id, column.key, isChecked);
                            if (e.target.checked) {
                              handleUpdate(row.id, 'end_date', null);
                            }
                          }}
                        />
                      ) : column.key === 'content' ? (
                            <div className={styles.contentWrapper}>
                            <span 
                                className={styles.content}
                                onClick={(e) => handleNotesClick(row.id, row.content, row.notes, e.clientX, e.clientY)}
                            >
                                {row[column.key]}
                                <span className={styles.noteIcon} onClick={(e) => handleNotesClick(row.id, row.content, row.notes, e.clientX, e.clientY)}>
                                &#9998;
                                </span>
                            </span>
                            </div>
                      ) : column.key === 'no' ? (
                        <span className={styles.no} onClick={() => handleRowClick(row.id)}>
                          {row[column.key]}
                        </span>
                      ) : column.key === 'start_date' || column.key === 'end_date' ? (
                        editingField?.id === row.id && editingField?.key === column.key ? (
                          <input
                            type="datetime-local"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSave}
                            autoFocus
                            className={styles.dateTimeInput}
                            style={{ width: '150px' }} // 날짜 선택 창 폭 조정
                            disabled={row.single_day} // single_day 체크 시 비활성화
                          />
                        ) : (
                          <span onClick={() => handleCellClick(row.id, column.key, row[column.key])}>
                            {row.single_day && column.key === 'end_date' ? '' : row[column.key] === null ? '당일' : formatDateTime(row[column.key])}
                          </span>
                        )
                      ) : (
                        <span onClick={() => handleCellClick(row.id, column.key, row[column.key])}>
                          {editingField?.id === row.id && editingField?.key === column.key ? (
                            <input 
                              type="text" 
                              value={editValue} 
                              onChange={(e) => setEditValue(e.target.value)} 
                              onBlur={handleSave}
                              autoFocus
                              className={styles.editable}
                              style={{ width: '100%' }}
                            />
                          ) : (
                            column.key.includes('date') || column.key.includes('created_at') ? formatDateTime(row[column.key]) : row[column.key]
                          )}
                        </span>
                      )}
                      {history.find(h => h.id === row.id && h.key === column.key) && (
                        <span className={styles.icon} onClick={(e) => handleHistoryClick(row.id, column.key, e.clientX, e.clientY)}>&#9998;</span>
                      )}
                    </div>
                  </td>
                ))}
                <td className={styles.td}>
                  <div className={styles.actionButtons}>
                    <button className={styles.button} onClick={() => handleSendEstimate(row.id)}>견적발송</button>
                    <button className={styles.button} onClick={() => handleClassAssignment(row.id)}>수업배정</button>
                    <button className={styles.deleteButton} onClick={() => handleDelete(row.id)}>삭제</button>
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      {showPopup && renderPopup()}
    </div>
  )

      
  const handleClassAssignment = async (inquiryId: string) => {
    // 먼저 inquiry 데이터를 가져옵니다.
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .select('*')
      .eq('id', inquiryId)
      .single();
  
    if (inquiryError) {
      console.error('Error fetching inquiry:', inquiryError);
      return;
    }
  
    // inquiries 데이터를 classes 테이블로 복사합니다.
    const { data, error } = await supabase.from('classes').insert({
      inquiry_id: inquiry.id,
      client_name: inquiry.client_name,
      client_email: inquiry.client_email,
      client_phone: inquiry.client_phone,
      start_date: inquiry.start_date,
      end_date: inquiry.single_day ? null : inquiry.end_date, // single_day 체크 시 end_date는 null
      single_day: inquiry.single_day,
      time: inquiry.time,
      class_type: inquiry.class_type,
      target_audience: inquiry.target_audience,
      institution: inquiry.institution,
      content: inquiry.content,
      notes: inquiry.notes,
      status: '문의 및 접수', // 초기 상태 설정
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      class_details: '',
      equipment_and_materials: '',
      confirmed_instructor1_fee: 0,
      confirmed_instructor2_fee: 0,
      applied_instructors: '',
      confirmed_instructor1: '',
      confirmed_instructor2: ''
    });
  
    if (error) {
      console.error('Error adding class:', error);
    } else {
      console.log('Class added successfully:', data);
      fetchData();
    }
  };
  

              
  
  const handleMemo = (id: string) => {
    // 정리 기능 구현
  }

  const handleSendEstimate = (id: string) => {
    // 견적발송 기능 구현
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>수업 문의 및 견적 요청</h2>
        <button className={styles.button} onClick={handleAddNewInquiry}>[신규]</button>
      </div>
      {renderTable()}
    </div>
  )
}
