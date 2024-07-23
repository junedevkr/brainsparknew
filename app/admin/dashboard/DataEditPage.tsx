'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import styles from './DataEditPage.module.css';

const initialData = {
  services: [
    { title: '', description: '', icon: '' }
  ],
  feedbacks: [
    { image: '', name: '', job: '', feedback: '' }
  ],
  programs: [
    { title: '', description: '', image: '', time: '', people: '', target: '' }
  ],
  schools: [
    { image: '', name: '' }
  ]
};

const DataEditPage = () => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/saveData')
      .then((response) => response.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading data:', error);
        setError('Error loading data');
        setLoading(false);
      });
  }, []);

  const handleSave = async (type) => {
    const response = await fetch('/api/saveData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ section: type, data: data[type] }),
    });

    const result = await response.json();
    if (response.ok) {
      alert(result.message);
    } else {
      alert('Error saving data: ' + result.message);
    }
  };

  const handleInputChange = (type, index, field, value) => {
    setData((prev) => {
      const newData = { ...prev };
      newData[type][index][field] = value;
      return newData;
    });
  };

  const handleAddItem = (type) => {
    setData((prev) => {
      const newData = { ...prev };
      const newItem = { ...initialData[type][0] };
      newData[type] = [...newData[type], newItem];
      return newData;
    });
  };

  const handleDeleteItem = (type, index) => {
    setData((prev) => {
      const newData = { ...prev };
      newData[type] = newData[type].filter((_, i) => i !== index);
      return newData;
    });
  };

  const handleImageUpload = async (type, index, field, event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/uploadImage', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    if (response.ok) {
      const imageUrl = `/images/${result.fileName}`;
      setData((prev) => {
        const newData = { ...prev };
        newData[type][index][field] = imageUrl;
        return newData;
      });
    } else {
      alert('Error uploading image: ' + result.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <h1>데이터 편집</h1>

      {Object.keys(data).map((type) => (
        <section key={type}>
          <div className={styles.sectionHeader}>
            <h2>{type.charAt(0).toUpperCase() + type.slice(1)}</h2>
            <button onClick={() => handleSave(type)} className={styles.saveButton}>저장</button>
          </div>
          <div className={styles.gridContainer}>
            {data[type].map((item, index) => (
              <div key={index} className={styles.card}>
                {Object.keys(item).map((field) => (
                  <div key={field} className={styles.fieldContainer}>
                    <label>{field}</label>
                    {field === 'icon' || field === 'image' ? (
                      <>
                        <img src={item[field]} alt={field} className={styles.image} />
                        <input
                          type="file"
                          onChange={(e) => handleImageUpload(type, index, field, e)}
                          className={styles.uploadInput}
                        />
                        <input
                          type="text"
                          value={item[field]}
                          readOnly
                          className={styles.readOnlyInput}
                        />
                      </>
                    ) : (
                      <input
                        type="text"
                        value={item[field]}
                        onChange={(e) => handleInputChange(type, index, field, e.target.value)}
                      />
                    )}
                  </div>
                ))}
                <button onClick={() => handleDeleteItem(type, index)} className={styles.deleteButton}>삭제</button>
              </div>
            ))}
            <button onClick={() => handleAddItem(type)} className={styles.addButton}>추가</button>
          </div>
        </section>
      ))}
    </div>
  );
};

export default DataEditPage;
