"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import styles from './ClassDetails.module.css';

const ClassDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const [inquiry, setInquiry] = useState<any>(null);
  const [classData, setClassData] = useState<any>(null);
  const [isEditingInquiry, setIsEditingInquiry] = useState(false);
  const [isEditingClass, setIsEditingClass] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (id) {
      fetchClassData(id as string);
    }
  }, [id]);

  const fetchClassData = async (classId: string) => {
    try {
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*, inquiry_id')
        .eq('id', classId)
        .single();

      if (classError) throw classError;

      setClassData(classData);

      const { data: inquiryData, error: inquiryError } = await supabase
        .from('inquiries')
        .select('*')
        .eq('id', classData.inquiry_id)
        .single();

      if (inquiryError) throw inquiryError;

      setInquiry(inquiryData);

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleEditInquiry = () => {
    setIsEditingInquiry(!isEditingInquiry);
  };

  const handleEditClass = () => {
    setIsEditingClass(!isEditingClass);
  };

  const handleInquiryChange = (field: string, value: string) => {
    setInquiry({ ...inquiry, [field]: value });
  };

  const handleClassChange = (field: string, value: string) => {
    setClassData({ ...classData, [field]: value });
  };

  const saveInquiryChanges = async () => {
    try {
      const { error } = await supabase
        .from('inquiries')
        .update(inquiry)
        .eq('id', inquiry.id);

      if (error) throw error;

      setIsEditingInquiry(false);
    } catch (error) {
      console.error('Error saving inquiry changes:', error);
    }
  };

  const saveClassChanges = async () => {
    try {
      const { error } = await supabase
        .from('classes')
        .update(classData)
        .eq('id', classData.id);

      if (error) throw error;

      setIsEditingClass(false);
    } catch (error) {
      console.error('Error saving class changes:', error);
    }
  };

  if (!inquiry || !classData) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.modalContent}>
      <h3>Inquiry Information</h3>
      <table className={styles.dataTable}>
        <tbody>
          {Object.keys(inquiry).map((field) => (
            <tr key={field}>
              <td>{field}</td>
              <td>
                {isEditingInquiry ? (
                  <input
                    type="text"
                    value={inquiry[field]}
                    onChange={(e) => handleInquiryChange(field, e.target.value)}
                  />
                ) : (
                  inquiry[field]
                )}
              </td>
            </tr>
          ))}ㄱ
        </tbody>
      </table>
      <button onClick={isEditingInquiry ? saveInquiryChanges : handleEditInquiry}>
        {isEditingInquiry ? 'Save Changes' : 'Edit'}
      </button>

      <h3>Class Information</h3>
      <table className={styles.dataTable}>
        <tbody>
          {Object.keys(classData).map((field) => (
            <tr key={field}>
              <td>{field}</td>
              <td>
                {isEditingClass ? (
                  <input
                    type="text"
                    value={classData[field]}
                    onChange={(e) => handleClassChange(field, e.target.value)}
                  />
                ) : (
                  classData[field]
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={isEditingClass ? saveClassChanges : handleEditClass}>
        {isEditingClass ? 'Save Changes' : 'Edit'}
      </button>
    </div>
  );
};

export default ClassDetails;
