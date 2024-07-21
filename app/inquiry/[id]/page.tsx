'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import styles from '../Inquiry.module.css';

interface Inquiry {
  id: string;
  no: number;
  client_name: string;
  client_email: string;
  content: string;
  notes: string;
}

interface Params {
  id: string;
}

const InquiryPage = ({ params }: { params: Params }) => {
  const supabase = createClientComponentClient();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const router = useRouter();
  const { id } = params;

  useEffect(() => {
    fetchInquiry();
  }, [id]);

  const fetchInquiry = async () => {
    const { data } = await supabase.from('inquiries').select('*').eq('id', id).single();
    if (data) setInquiry(data as Inquiry);
  };

  const handleUpdate = async (key: keyof Inquiry, value: string) => {
    const { error } = await supabase.from('inquiries').update({ [key]: value }).eq('id', id);
    if (error) {
      console.error('Error updating data:', error);
    } else {
      fetchInquiry();
    }
  };

  if (!inquiry) return <div>Loading...</div>;

  return (
    <div className={styles.container}>
      <h1>Inquiry #{inquiry.no}</h1>
      <div className={styles.field}>
        <label>고객명:</label>
        <input 
          type="text" 
          value={inquiry.client_name} 
          onChange={(e) => handleUpdate('client_name', e.target.value)} 
        />
      </div>
      <div className={styles.field}>
        <label>이메일:</label>
        <input 
          type="text" 
          value={inquiry.client_email} 
          onChange={(e) => handleUpdate('client_email', e.target.value)} 
        />
      </div>
      <div className={styles.field}>
        <label>내용:</label>
        <textarea 
          value={inquiry.content} 
          onChange={(e) => handleUpdate('content', e.target.value)} 
        />
      </div>
      <div className={styles.field}>
        <label>메모:</label>
        <textarea 
          value={inquiry.notes} 
          onChange={(e) => handleUpdate('notes', e.target.value)} 
        />
      </div>
    </div>
  );
};

export default InquiryPage;
