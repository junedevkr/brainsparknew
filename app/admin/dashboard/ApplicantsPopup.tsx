'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import styles from './ApplicantsPopup.module.css';

interface ApplicantsPopupProps {
  classData: any;
  type: 'main' | 'sub';
  onClose: () => void;
}

interface Instructor {
  id: string;
  name: string;
  phone: string;
  email: string;
  isSelected: boolean;
}

const ApplicantsPopup: React.FC<ApplicantsPopupProps> = ({ classData, type, onClose }) => {
  const supabase = createClientComponentClient();
  const [applicants, setApplicants] = useState<Instructor[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);

  useEffect(() => {
    console.log('ApplicantsPopup mounted with classData:', classData, 'and type:', type);
    fetchApplicants();

    const channel = supabase
      .channel(`classes_${classData.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'classes', filter: `id=eq.${classData.id}` }, fetchApplicants)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classData.id, type]);

  const fetchApplicants = async () => {
    console.log('Fetching applicants for class:', classData.id);
  
    const applicantIds = type === 'main' ? classData.apply_main : classData.apply_sub;
    const selectedIds = type === 'main' ? classData.instructor_main : classData.instructor_sub;
  
    console.log('Applicant IDs:', applicantIds);
    console.log('Selected IDs:', selectedIds);
  
    if (!applicantIds || applicantIds.length === 0) {
      console.log('No applicants found');
      setApplicants([]);
      return;
    }
  
    const { data: instructorsData, error } = await supabase
      .from('instructor_profiles')
      .select('*')
      .in('id', applicantIds);
  
    if (error) {
      console.error('Error fetching instructors:', error);
      return;
    }
  
    console.log('Fetched instructors:', instructorsData);
  
    const updatedApplicants = instructorsData.map((instructor: Instructor) => ({
      ...instructor,
      isSelected: selectedIds?.includes(instructor.id) || false
    }));
  
    console.log('Updated applicants:', updatedApplicants);
    setApplicants(updatedApplicants);
  };

  const handleApplicantSelection = async (instructorId: string) => {
    console.log('Handling applicant selection for:', instructorId);
  
    const instructorField = type === 'main' ? 'instructor_main' : 'instructor_sub';
    const currentInstructors = classData[instructorField] || [];
  
    let updatedInstructors;
    if (currentInstructors.includes(instructorId)) {
      // 체크 해제: instructor 리스트에서 제거
      updatedInstructors = currentInstructors.filter((id: string) => id !== instructorId);
    } else {
      // 체크: instructor 리스트에 추가
      updatedInstructors = [...currentInstructors, instructorId];
    }
  
    const { error } = await supabase
      .from('classes')
      .update({ [instructorField]: updatedInstructors })
      .eq('id', classData.id);
  
    if (error) {
      console.error('Error updating class:', error);
    } else {
      console.log('Class updated successfully');
      // classData를 직접 업데이트
      classData[instructorField] = updatedInstructors;
      fetchApplicants(); // 데이터 새로고침
    }
  };
  
  const renderInstructorProfile = (instructor: Instructor) => (
    <div className={styles.profilePopup}>
      <h4>{instructor.name}</h4>
      <p>연락처: {instructor.phone}</p>
      <p>이메일: {instructor.email}</p>
      <button onClick={() => {/* 자세히 보기 로직 */}}>자세히 보기</button>
      <button onClick={() => setSelectedInstructor(null)}>닫기</button>
    </div>
  );

  console.log('Rendering ApplicantsPopup with applicants:', applicants);

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <h3>{type === 'main' ? '주강사' : '보조강사'} 신청자 목록</h3>
        {applicants.length === 0 ? (
          <p>신청자가 없습니다.</p>
        ) : (
          applicants.map((applicant, index) => (
            <div key={applicant.id} className={`${styles.applicantRow} ${index % 2 === 0 ? styles.evenRow : styles.oddRow}`}>
              <input
                type="checkbox"
                id={`applicant-${applicant.id}`}
                checked={applicant.isSelected}
                onChange={() => handleApplicantSelection(applicant.id)}
              />
              <label
                htmlFor={`applicant-${applicant.id}`}
                onClick={() => setSelectedInstructor(applicant)}
              >
                {applicant.name}
              </label>
            </div>
          ))
        )}
        <button onClick={onClose}>닫기</button>
      </div>
      {selectedInstructor && renderInstructorProfile(selectedInstructor)}
    </div>
  );
};

export default ApplicantsPopup;
