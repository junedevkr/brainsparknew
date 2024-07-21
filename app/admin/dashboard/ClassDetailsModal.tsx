import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import styles from './ClassDetailsModal.module.css';
import { columnConfig } from './InquiriesPage';
import SchedulePopup from './SchedulePopup';
import { FaEdit } from 'react-icons/fa';

interface ClassDetailsModalProps {
  classId: string | null;
  onClose: () => void;
}

interface Instructor {
  id: string;
  name: string;
}

interface InquiryData {
  id: string;
  [key: string]: any;
}

interface ClassData {
  id: string;
  inquiry_id: string;
  [key: string]: any;
}

interface HistoryEntry {
  id: string;
  inquiry_id: string;
  field_name: string;
  updated_at: string;
  old_value: string;
  new_value: string;
}

const ClassDetailsModal: React.FC<ClassDetailsModalProps> = ({ classId, onClose }) => {
  const supabase = createClientComponentClient();
  const [inquiryData, setInquiryData] = useState<InquiryData | null>(null);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [inquiriesHistory, setInquiriesHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<HistoryEntry[]>([]);
  const [editingField, setEditingField] = useState<{ id: string, key: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState<{ x: number, y: number } | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<{ id: string, content: string, notes: string } | null>(null);
  const [historyModalIsOpen, setHistoryModalIsOpen] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);

  useEffect(() => {
    if (classId) {
      fetchData(classId);
    }
  }, [classId]);

  const fetchData = async (id: string) => {
    setIsLoading(true);

    // Fetch class data
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .single();

    if (classError) {
      console.error('Error fetching class data:', classError);
      setIsLoading(false);
      return;
    }

    // Fetch inquiry data using inquiry_id from class data
    const { data: inquiryData, error: inquiryError } = await supabase
      .from('inquiries')
      .select('*')
      .eq('id', classData.inquiry_id)
      .single();

    if (inquiryError) {
      console.error('Error fetching inquiry data:', inquiryError);
      setIsLoading(false);
      return;
    }

    // Fetch inquiries history
    const { data: inquiriesHistoryData, error: inquiriesHistoryError } = await supabase
      .from('inquiries_history')
      .select('*')
      .eq('inquiry_id', classData.inquiry_id);

    if (inquiriesHistoryError) {
      console.error('Error fetching inquiries history:', inquiriesHistoryError);
      setIsLoading(false);
      return;
    }

    // Fetch instructors
    const { data: instructorsData, error: instructorsError } = await supabase
      .from('instructor_profiles')
      .select('id, name');

    if (instructorsError) {
      console.error('Error fetching instructors data:', instructorsError);
      setIsLoading(false);
      return;
    }

    setClassData(classData);
    setInquiryData(inquiryData);
    setInquiriesHistory(inquiriesHistoryData || []);
    setInstructors(instructorsData || []);
    setIsLoading(false);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, table: string) => {
    const { name, value } = e.target;

    if (table === 'inquiry') {
      setInquiryData(prev => prev ? { ...prev, [name]: value } : null);
    } else {
      setClassData(prev => prev ? { ...prev, [name]: value } : null);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);

    if (inquiryData && classData) {
      // Update inquiry data
      const { error: inquiryError } = await supabase
        .from('inquiries')
        .update({ notes: inquiryData.notes })
        .eq('id', inquiryData.id);

      if (inquiryError) {
        console.error('Error updating inquiry data:', inquiryError);
        setIsLoading(false);
        return;
      }

      // Update class data
      const { error: classError } = await supabase
        .from('classes')
        .update(classData)
        .eq('id', classData.id);

      if (classError) {
        console.error('Error updating class data:', classError);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(false);
    onClose();
  };

  const renderInstructorName = (id: string) => {
    const instructor = instructors.find(inst => inst.id === id);
    return instructor ? instructor.name : 'Unknown';
  };

  const openHistoryModal = (history: HistoryEntry[]) => {
    setSelectedHistory(history);
    setHistoryModalIsOpen(true);
  };

  const closeHistoryModal = () => {
    setHistoryModalIsOpen(false);
    setSelectedHistory([]);
  };

  const handleHistoryClick = async (inquiry_id: string, field_name: string, x: number, y: number) => {
    const { data } = await supabase
      .from('inquiries_history')
      .select('*')
      .eq('inquiry_id', inquiry_id)
      .eq('field_name', field_name)
      .order('updated_at', { ascending: false });

    setSelectedHistory(data || []);
    setPopupPosition({ x, y });
    setShowPopup(true);
  };

  const handleCellClick = (id: string, key: string, value: string) => {
    if (key !== 'created_at' && key !== 'updated_at') {
      setEditingField({ id, key });
      setEditValue(value);
    }
  };

  const handleSaveEdit = () => {
    if (editingField) {
      handleUpdate(editingField.id, editingField.key, editValue);
    }
  };

  const handleUpdate = async (id: string, key: string, value: any) => {
    const { error } = await supabase.from('inquiries').update({ [key]: value }).eq('id', id);
    if (error) {
      console.error('Error updating data:', error);
    } else {
      fetchData(id);
      setEditingField(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  const handleScheduleClick = (classData: ClassData) => {
    setSelectedClass(classData);
    setShowSchedulePopup(true);
  };

  const handleNotesClick = (id: string, content: string, notes: string, x: number, y: number) => {
    setSelectedNotes({ id, content, notes });
    setPopupPosition({ x, y });
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedNotes(null);
    setSelectedHistory([]);
  };

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
            {selectedHistory.map((entry: HistoryEntry) => (
              <div key={entry.id}>
              <p>{formatDateTime(entry.updated_at)}: {entry.old_value} &gt; {entry.new_value}</p>              </div>
            ))}
          </>
        )}
        <button className={styles.button} onClick={closePopup}>Close</button>
      </div>
    </div>
  );

  const classFieldLabels: { [key: string]: string } = {
    class_details: '수업 세부사항',
    equipment_and_materials: '장비 및 자료',
    additional_info: '추가 정보',
    class_open_status: '모집 상태',
    confirmed_instructor1_fee: '강사1 수업료',
    confirmed_instructor2_fee: '강사2 수업료',
    instructor_main: '주 강사',
    instructor_sub: '보조 강사',
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!inquiryData || !classData) {
    return <div>No data available</div>;
  }



  return (
    <div className={styles.modalContent}>
      <div className={styles.modalHeader}>
        <h2 className={styles.modalTitle}>수업 정보</h2>
        <button className={styles.closeButton} onClick={onClose}>&times;</button>
      </div>
      <div className={styles.modalBody}>
        <div className={styles.inquiryTableContainer}>
          <h3 className={styles.tableTitle}>수업 문의</h3>
          <table className={styles.dataTable}>
            <tbody>
              {inquiryData && columnConfig.map((column) => (
                <tr key={column.key}>
                  <th>{column.title}</th>
                  <td>
                    {column.key === 'status' ? (
                      <select name={column.key} value={inquiryData[column.key]} onChange={(e) => handleInputChange(e, 'inquiry')}>
                        <option value="문의 및 접수">문의 및 접수</option>
                        <option value="진행중">진행중</option>
                        <option value="확정">확정</option>
                        <option value="취소">취소</option>
                        <option value="종료">종료</option>
                      </select>
                    ) : column.key === 'single_day' ? (
                      <input
                        type="checkbox"
                        name={column.key}
                        checked={inquiryData[column.key]}
                        onChange={(e) => handleInputChange(e, 'inquiry')}
                      />
                    ) : column.key === 'content' ? (
                      <div className={styles.contentWrapper}>
                        <span
                          className={styles.content}
                          onClick={(e) => handleNotesClick(inquiryData.id, inquiryData.content, inquiryData.notes, e.clientX, e.clientY)}
                        >
                          {inquiryData[column.key]}
                          <span className={styles.noteIcon} onClick={(e) => handleNotesClick(inquiryData.id, inquiryData.content, inquiryData.notes, e.clientX, e.clientY)}>
                            <FaEdit />
                          </span>
                        </span>
                      </div>
                    ) : (
                      <input
                        type="text"
                        name={column.key}
                        value={inquiryData[column.key]}
                        onChange={(e) => handleInputChange(e, 'inquiry')}
                        disabled={column.key === 'id' || column.key === 'no' || column.key === 'created_at' || column.key === 'updated_at'}
                      />
                    )}
                    {inquiriesHistory.some(h => h.field_name === column.key) && (
                      <span className={styles.icon} onClick={() => openHistoryModal(inquiriesHistory.filter(h => h.field_name === column.key))}><FaEdit /></span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.classTableContainer}>
          <h3 className={styles.tableTitle}>수업 배정</h3>
          <table className={styles.dataTable}>
            <tbody>
              {classData && Object.keys(classData).map((key) => (
                key !== 'id' && key !== 'inquiry_id' && (
                  <tr key={key}>
                    <th>{classFieldLabels[key]}</th>
                    <td>
                      {key === 'class_open_status' ? (
                        <select name={key} value={classData[key]} onChange={(e) => handleInputChange(e, 'class')}>
                          <option value="비공개">비공개</option>
                          <option value="모집중">모집중</option>
                          <option value="모집완료">모집완료</option>
                        </select>
                      ) : key === 'instructor_main' || key === 'instructor_sub' ? (
                        <div>
                          {classData[key]?.map((instructorId: string) => (
                            <div key={instructorId}>
                              <a href={`/admin/instructor/${instructorId}`} target="_blank" rel="noopener noreferrer">
                                {renderInstructorName(instructorId)}
                              </a>
                            </div>
                          )) || 'None'}
                        </div>
                      ) : (
                        <textarea
                          name={key}
                          value={classData[key]}
                          onChange={(e) => handleInputChange(e, 'class')}
                          disabled={key === 'id' || key === 'inquiry_id' || key === 'created_at' || key === 'updated_at'}
                          rows={5}
                          className={styles.textarea}
                        />
                      )}
                    </td>
                  </tr>
                )
              ))}
              <tr>
                <td colSpan={2}>
                  <button className={styles.button} onClick={() => handleScheduleClick(classData)}>
                    수업 일정 보기
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <button className={styles.saveButton} onClick={handleSave}>Save</button>
      {showPopup && renderPopup()}
      {showSchedulePopup && selectedClass && (
        <SchedulePopup
          classData={selectedClass}
          onClose={() => setShowSchedulePopup(false)}
        />
      )}
      {historyModalIsOpen && (
        <div className={styles.historyModalOverlay}>
          <div className={styles.historyModalContent}>
            <h3>수정 내역</h3>
            {selectedHistory && selectedHistory.map((entry: any) => (
              <div key={entry.id}>
                <p>{formatDateTime(entry.updated_at)}: {entry.old_value} &gt; {entry.new_value}</p>
              </div>
            ))}
            <button className={styles.closeButton} onClick={closeHistoryModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassDetailsModal;
