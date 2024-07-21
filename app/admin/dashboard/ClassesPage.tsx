'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import styles from './Dashboard.module.css'
import { columnConfig } from './InquiriesPage'
import ApplicantsPopup from './ApplicantsPopup';
import SchedulePopup from './SchedulePopup';

interface Inquiry {
  id: string;
  [key: string]: any;
}

interface ClassData {
  id: string;
  inquiry_id: string;
  class_open_status: string;
  additional_info?: string;
  content?: string;
  class_details?: string;
  confirmed_instructor1_fee?: string;
  confirmed_instructor2_fee?: string;
  apply_main?: string[];
  apply_sub?: string[];
  [key: string]: any;
}

interface ShowInquiryColumns {
  [key: string]: boolean;
}

interface CurrentApplicants {
  classData: ClassData;
  type: 'main' | 'sub';
}

export default function ClassesPage() {
  const supabase = createClientComponentClient()
  const [classes, setClasses] = useState<ClassData[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [showApplicantsPopup, setShowApplicantsPopup] = useState(false)
  const [currentApplicants, setCurrentApplicants] = useState<CurrentApplicants | null>(null);

  const [showInquiryColumns, setShowInquiryColumns] = useState<ShowInquiryColumns>(
    columnConfig.reduce((acc, { key }) => {
      acc[key] = key === 'institution' || key === 'location';
      return acc;
    }, {} as ShowInquiryColumns)
  );


  const [showPopup, setShowPopup] = useState(false)
  const [popupPosition, setPopupPosition] = useState<{ x: number, y: number } | null>(null)
  const [editingField, setEditingField] = useState<{ id: string, key: string } | null>(null)
  const [editValue, setEditValue] = useState<string>('')

  const [showSaveButton, setShowSaveButton] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    let { data: inquiriesData, error: inquiriesError } = await supabase
      .from('inquiries')
      .select('*')
      .eq('status', '확정')
    
    if (inquiriesError) {
      console.error('Error fetching inquiries:', inquiriesError)
    } else if (inquiriesData) {
      setInquiries(inquiriesData)
    }

    let { data: classesData, error: classesError } = await supabase
      .from('classes')
      .select('*')
    
    if (classesError) {
      console.error('Error fetching classes:', classesError)
    } else if (classesData) {
      setClasses(classesData)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    console.log(`Updating status for class ${id} to ${status}`); // 디버깅용 로그
    const { data, error } = await supabase
      .from('classes')
      .update({ class_open_status: status })
      .eq('id', id)
      .select()
  
    if (error) {
      console.error('Error updating status:', error)
    } else {
      console.log('Status updated successfully:', data); // 디버깅용 로그
      fetchData()
      if (status === '모집중') {
        // TODO: 모든 강사에게 알림을 보내는 함수 호출
        // notifyInstructors(id)
      }
    }
  }
      
  const openApplicantsPopup = (type: 'main' | 'sub', classData: ClassData) => {
    console.log('Opening applicants popup for class:', classData.id, 'and type:', type);
    if (!classData.id) {
      console.error('Class ID is undefined');
      return;
    }
    setCurrentApplicants({ type, classData });
    setShowApplicantsPopup(true);
  };
  
  const handleSave = async () => {
    if (editingField) {
      const { id, key } = editingField;
      const { error } = await supabase
        .from('classes')
        .update({ [key]: editValue })
        .eq('id', id);

      if (error) {
        console.error('Error updating data:', error);
      } else {
        fetchData();
      }
      setEditingField(null);
      setShowSaveButton(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      handleSave();
      const editables = Array.from(document.querySelectorAll('input, textarea'));
      const currentIndex = editables.indexOf(e.currentTarget);
      const nextEditable = editables[currentIndex + 1] as HTMLElement | null;
      nextEditable?.focus();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditValue(e.target.value);
    adjustTextareaHeight(e.target);
  };

  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  };

  const handleEdit = (id: string, key: string, value: string) => {
    setEditingField({ id, key });
    setEditValue(value);
    setShowSaveButton(true);
  };



  const handleUpdate = async (id: string, key: string, value: any) => {
    const { error } = await supabase.from('classes').update({ [key]: value }).eq('id', id)
    if (error) {
      console.error('Error updating data:', error)
    } else {
      fetchData()
      setEditingField(null)
    }
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setShowInquiryColumns(prevState => ({
      ...prevState,
      [name]: checked
    }))
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

  const handleTextSave = () => {
    if (editingField) {
      handleUpdate(editingField.id, editingField.key, editValue)
      setEditingField(null)
    }
  }

  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      handleTextSave()
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [editingField, editValue])

  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);

  const handleScheduleClick = (classData: any) => {
    setSelectedClass(classData);
    setShowSchedulePopup(true);
  };



  const renderTable = () => (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columnConfig.map(({ key, title }) => (
              showInquiryColumns[key] && (
                <th key={key} className={styles.th}>
                  {title}
                </th>
              )
            ))}
            <th className={`${styles.th} ${styles.thContent}`}>수업상세</th>
            <th className={`${styles.th} ${styles.thContent}`}>교구 및 장비</th>
            <th className={`${styles.th} ${styles.thContent}`}>수업정보추가</th>
            <th className={styles.th}>강사모집상태</th>
            <th className={styles.th}>강사1강사비</th>
            <th className={styles.th}>강사2강사비</th>
            <th className={styles.th}>강사지원현황</th>
            <th className={styles.th}>상세수업일정배정</th>
          </tr>
        </thead>
        <tbody>
          {inquiries.map((inquiry) => {
             const classData = classes.find((c) => c.inquiry_id === inquiry.id) || {} as ClassData;            return (
              <tr key={inquiry.id}>
                {columnConfig.map(({ key }) => (
                  showInquiryColumns[key] && (
                    <td key={key} className={styles.td}>
                      {key.includes('date') ? formatDateTime(inquiry[key]) : inquiry[key]}
                    </td>
                  )
                ))}
                <td 
                  className={`${styles.td} ${styles.tdContent}`} 
                  onClick={() => handleEdit(classData.id, 'class_details', classData.class_details || '')}
                >
                  {editingField?.id === classData.id && editingField?.key === 'class_details' ? (
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleSave}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className={styles.editTextarea}
                    />
                  ) : (
                    <pre className={styles.preWrap}>
                      {classData.class_details || <span className={styles.placeholder}>클릭하여 입력</span>}
                    </pre>
                  )}
                </td>
                <td 
                  className={`${styles.td} ${styles.tdContent}`} 
                  onClick={() => handleEdit(classData.id, 'equipment_and_materials', classData.equipment_and_materials || '')}
                >
                  {editingField?.id === classData.id && editingField?.key === 'equipment_and_materials' ? (
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleSave}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className={styles.editTextarea}
                    />
                  ) : (
                    <pre className={styles.preWrap}>
                      {classData.equipment_and_materials || <span className={styles.placeholder}>클릭하여 입력</span>}
                    </pre>
                  )}
                </td>

                <td 
                  className={`${styles.td} ${styles.tdContent}`} 
                  onClick={() => handleEdit(classData.id, 'additional_info', classData.additional_info || '')}
                >
                  {editingField?.id === classData.id && editingField?.key === 'additional_info' ? (
                    <div className={styles.editContainer}>
                      <textarea
                        ref={textareaRef}
                        value={editValue}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className={styles.editTextarea}
                      />
                      {showSaveButton && (
                        <button onClick={handleSave} className={styles.saveButton}>
                          저장
                        </button>
                      )}
                    </div>
                  ) : (
                    <pre className={styles.preWrap}>
                      {classData.additional_info || <span className={styles.placeholder}>클릭하여 입력</span>}
                    </pre>
                  )}
                </td>
                <td className={styles.td}>
                  <select
                    value={classData.class_open_status || '비공개'}
                    onChange={(e) => handleStatusChange(classData.id, e.target.value)}
                  >
                    <option value="비공개">비공개</option>
                    <option value="모집중">모집중</option>
                    <option value="모집완료">모집완료</option>
                  </select>
                </td>
                <td className={styles.td} onClick={() => handleEdit(classData.id, 'confirmed_instructor1_fee', classData.confirmed_instructor1_fee || '')}>
                  {editingField?.id === classData.id && editingField?.key === 'confirmed_instructor1_fee' ? (
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleSave}
                      onKeyDown={handleKeyDown}
                      autoFocus
                    />
                  ) : (
                    classData.confirmed_instructor1_fee || <span className={styles.placeholder}>클릭하여 입력</span>
                  )}
                </td>
                <td className={styles.td} onClick={() => handleEdit(classData.id, 'confirmed_instructor2_fee', classData.confirmed_instructor2_fee || '')}>
                  {editingField?.id === classData.id && editingField?.key === 'confirmed_instructor2_fee' ? (
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleSave}
                      onKeyDown={handleKeyDown}
                      autoFocus
                    />
                  ) : (
                    classData.confirmed_instructor2_fee || <span className={styles.placeholder}>클릭하여 입력</span>
                  )}
                </td>
                <td className={styles.td}>
                <button onClick={() => openApplicantsPopup('main', classData)}>
                  메인 강사 지원자 ({classData.apply_main?.length || 0})
                </button>
                <button onClick={() => openApplicantsPopup('sub', classData)}>
                  보조 강사 지원자 ({classData.apply_sub?.length || 0})
                </button>
              </td>
                <td className={styles.td}>
                <button onClick={() => handleScheduleClick(classData)}>
                  수업 일정 및 강사 배정
                </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {showSchedulePopup && selectedClass && (
        <SchedulePopup
          classData={selectedClass}
          onClose={() => setShowSchedulePopup(false)}
        />
      )}
      {showApplicantsPopup && currentApplicants && (
      <ApplicantsPopup
        classData={currentApplicants.classData}
        type={currentApplicants.type}
        onClose={() => setShowApplicantsPopup(false)}
      />
    )}
    </div>
  )

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>수업 관리 및 강사 배정</h2>
      <div className={styles.checkboxContainer}>
        {columnConfig.map(({ key, title }) => (
          <label key={key}>
            <input
              type="checkbox"
              name={key}
              checked={showInquiryColumns[key]}
              onChange={handleCheckboxChange}
            />
            {title}
          </label>
        ))}
      </div>
      {renderTable()}
    </div>
  )
}
