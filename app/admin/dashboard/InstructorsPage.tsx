'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import styles from './Dashboard.module.css'
import Link from 'next/link'
import { FaPencilAlt } from 'react-icons/fa'

interface InstructorProfile {
  id: string;
  no: string;
  name: string;
  email: string;
  phone: string;
  account_number: string;
  note: string;
}

export default function InstructorsPage() {
  const supabase = createClientComponentClient()
  const [instructorProfiles, setInstructorProfiles] = useState<InstructorProfile[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [sortConfig, setSortConfig] = useState<{ key: keyof InstructorProfile; direction: 'ascending' | 'descending' }>({ key: 'id', direction: 'ascending' })
  const [editingNote, setEditingNote] = useState<{ id: string; note: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    let { data: instructorProfilesData, error } = await supabase
      .from('instructor_profiles')
      .select('*')

    if (error) {
      console.error('Error fetching instructor profiles:', error)
    } else if (instructorProfilesData) {
      setInstructorProfiles(instructorProfilesData)
    }
  }

  const handleSort = (key: keyof InstructorProfile) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  }

  const sortedProfiles = [...instructorProfiles].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
    return 0;
  });

  const filteredProfiles = sortedProfiles.filter(profile =>
    profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const paginatedProfiles = filteredProfiles.slice((currentPage - 1) * 20, currentPage * 20)

  const handleEditNote = (id: string, note: string) => {
    setEditingNote({ id, note });
  }

  const handleSaveNote = async () => {
    if (editingNote) {
      const { error } = await supabase
        .from('instructor_profiles')
        .update({ note: editingNote.note })
        .eq('id', editingNote.id)

      if (error) {
        console.error('Error updating note:', error)
      } else {
        setInstructorProfiles(profiles =>
          profiles.map(profile =>
            profile.id === editingNote.id ? { ...profile, note: editingNote.note } : profile
          )
        )
        setEditingNote(null)
      }
    }
  }

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>강사 관리</h2>
      <div className={styles.searchContainer}>
        <input 
          type="text" 
          placeholder="강사 이름 또는 이메일 검색" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th} onClick={() => handleSort('no')}>순번 {sortConfig.key === 'no' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}</th>
              <th className={styles.th} onClick={() => handleSort('name')}>이름 {sortConfig.key === 'name' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}</th>
              <th className={styles.th} onClick={() => handleSort('email')}>이메일</th>
              <th className={styles.th} onClick={() => handleSort('phone')}>전화번호</th>
              <th className={styles.th} onClick={() => handleSort('account_number')}>계좌번호</th>
              <th className={styles.th}>노트</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProfiles.map(profile => (
              <tr key={profile.id}>
                <td className={styles.td}>{profile.no}</td>
                <td className={styles.td}>
                  <Link href={`/instructor/profile/${profile.id}`} target="_blank" rel="noopener noreferrer">
                    {profile.name}
                  </Link>
                </td>
                <td className={styles.td}>{profile.email}</td>
                <td className={styles.td}>{profile.phone}</td>
                <td className={styles.td}>{profile.account_number}</td>
                <td className={styles.td}>
                  <button onClick={() => handleEditNote(profile.id, profile.note)} className={styles.editButton}>
                    <FaPencilAlt />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.pagination}>
        {Array(Math.ceil(filteredProfiles.length / 20)).fill(null).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentPage(index + 1)}
            className={currentPage === index + 1 ? styles.activePage : ''}
          >
            {index + 1}
          </button>
        ))}
      </div>
      {editingNote && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>노트 편집</h2>
            <textarea
              value={editingNote.note}
              onChange={(e) => setEditingNote({ ...editingNote, note: e.target.value })}
              className={styles.noteTextarea}
            />
            <div className={styles.modalButtons}>
              <button onClick={handleSaveNote} className={styles.saveButton}>저장</button>
              <button onClick={() => setEditingNote(null)} className={styles.cancelButton}>취소</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}