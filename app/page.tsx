"use client";

import Image from 'next/image';
import styles from './page.module.css';
import { useEffect, useState } from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { FaClock, FaUserAlt, FaBullseye } from 'react-icons/fa';
import dynamic from 'next/dynamic';

const Home = () => {
  const [data, setData] = useState({
    services: [],
    feedbacks: [],
    programs: [],
    schools: []
  });

  useEffect(() => {
    fetch('/data.json')
      .then(response => response.json())
      .then(data => setData(data))
      .catch(error => console.error('Error fetching data:', error));

    // 애니메이션 추가 스크립트
    const scrollers = document.querySelectorAll<HTMLElement>(".scroller");

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      addAnimation();
    }

    function addAnimation() {
      scrollers.forEach((scroller) => {
        scroller.setAttribute("data-animated", "true");

        const scrollerInner = scroller.querySelector<HTMLElement>(".scroller__inner");
        if (scrollerInner) {
          const scrollerContent = Array.from(scrollerInner.children);

          scrollerContent.forEach((item) => {
            const duplicatedItem = item.cloneNode(true) as HTMLElement;
            duplicatedItem.setAttribute("aria-hidden", "true");
            scrollerInner.appendChild(duplicatedItem);
          });
        }
      });
    }
  }, []);

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <section className={styles.intro}>
          <h2>혁신적인 디지털 교육 솔루션 전문 교육 기업</h2>
          <h1>브레인스파크</h1>
        </section>

        <section className={styles.services}>
          <Carousel autoPlay={true} infiniteLoop={true} showThumbs={false} showStatus={false} showIndicators={false} interval={3000}>
            {data.services.map((service, index) => (
              <div key={index} className={styles.service}>
                <img src={service.icon} alt={service.title} className={styles.serviceImage} />
                <div className={styles.serviceContent}>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
              </div>
            ))}
          </Carousel>
        </section>

        <section className={styles.feedbacks}>
          <h2>브레인스파크와 함께한 교육</h2>
          <div className={styles.feedbackList}>
            {data.feedbacks.map((feedback, index) => (
              <div key={index} className={`${styles.feedback} ${styles[`feedback${index % 5}`]}`}>
                <img src={feedback.image} alt={feedback.name} className={styles.feedbackImage} />
                <h3>{feedback.name}</h3>
                <p>{feedback.job}</p>
                <p>{feedback.feedback}</p>
              </div>
            ))}
          </div>
          <div className={styles.schoolcontainer}>
            <ul className={styles.banner}>
              {data.schools.concat(data.schools).map((school, index) => (
                <li key={index} className={styles.box}>
                  <img src={school.image} alt={school.name} className={styles.schoolImage} />
                  <p>{school.name}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.programs}>
          <h2>교육 프로그램</h2>
          <div className={styles.programList}>
            {data.programs.map((program, index) => (
              <div key={index} className={styles.program}>
                <img src={program.image} alt={program.title} className={styles.programImage} />
                <h3>{program.title}</h3>
                <p>{program.description}</p>
                <div className={styles.programDetails}>
                  <div className={styles.programDetail}>
                    <FaClock />
                    <span>{program.time}</span>
                  </div>
                  <div className={styles.programDetail}>
                    <FaUserAlt />
                    <span>{program.people}</span>
                  </div>
                  <div className={styles.programDetail}>
                    <FaBullseye />
                    <span>{program.target}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.process}>
          <h2>프로세스 안내</h2>
          <div className={styles.processList}>
            <div className={styles.processItem}>
              <div className={styles.circle}>신청</div>
            </div>
            <div className={styles.processItem}>
              <div className={styles.circle}>상담</div>
            </div>
            <div className={styles.processItem}>
              <div className={styles.circle}>등록</div>
            </div>
            <div className={styles.processItem}>
              <div className={styles.circle}>교육</div>
            </div>
            <div className={styles.processItem}>
              <div className={styles.circle}>평가</div>
            </div>
          </div>
        </section>
        {/* <section className={styles.faq}>
          <h2>질문 답변</h2>
          <div className={styles.faqList}>
            <details>
              <summary>질문 1</summary>
              <p>답변 1</p>
            </details>
            <details>
              <summary>질문 2</summary>
              <p>답변 2</p>
            </details>
            <details>
              <summary>질문 3</summary>
              <p>답변 3</p>
            </details>
          </div>
        </section> */}

        <footer className={styles.footer}>
          <div className={styles.newsletter}>
            <h2>뉴스레터 구독</h2>
            <input type="email" placeholder="이메일 주소" />
            <button>구독하기</button>
          </div>
          <div className={styles.links}>
            <div>
              <h3>중요 링크</h3>
              <ul>
                <li><a href="#">이용 약관</a></li>
                <li><a href="#">개인정보 보호정책</a></li>
                <li><a href="#">쿠키 정책</a></li>
              </ul>
            </div>
            <div>
              <h3>서비스</h3>
              <ul>
                <li><a href="#">상담</a></li>
                <li><a href="#">시험 준비</a></li>
                <li><a href="#">교육</a></li>
              </ul>
            </div>
          </div>
          <p>© 2024 브레인스파크. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
};

export default Home;
