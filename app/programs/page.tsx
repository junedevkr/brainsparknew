'use client';

import { useState, useEffect } from 'react';
import styles from './ProductPage.module.css';

const ProductsPage = () => {
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);

  useEffect(() => {
    fetch('/data.json')
      .then(response => response.json())
      .then(data => {
        setPrograms(data.programs);
        setSelectedProgram(data.programs[0]); // Set the first program as default
      })
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  const handleTabClick = (program) => {
    setSelectedProgram(program);
  };

  if (!selectedProgram) {
    return <div>Loading...</div>;
  }

  return (
    <main className={styles.main}>
      <h1>프로그램 안내</h1>
      <div className={styles.tabs}>
        {programs.map((program) => (
          <button
            key={program.title}
            onClick={() => handleTabClick(program)}
            className={program.title === selectedProgram.title ? styles.activeTab : styles.tab}
          >
            {program.title}
          </button>
        ))}
      </div>

      <div className={styles.programDetails}>
        <h2>{selectedProgram.title}</h2>
        <p>{selectedProgram.description}</p>
        <img src={selectedProgram.image} alt={selectedProgram.title} className={styles.programImage} />

        <div className={styles.programInfo}>
          <p><strong>시간</strong> {selectedProgram.time}</p>
          <p><strong>인원</strong> {selectedProgram.people}</p>
          <p><strong>대상</strong> {selectedProgram.target}</p>
        </div>

        <table className={styles.detailsTable}>
          <thead>
            <tr>
              <th>교시</th>
              <th>내용</th>
            </tr>
          </thead>
          <tbody>
            {selectedProgram.details.map((detail, index) => (
              <tr key={index}>
                <td>{`${index + 1}교시`}</td>
                <td>{detail.replace(/^\d교시:\s*/, '')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default ProductsPage;
