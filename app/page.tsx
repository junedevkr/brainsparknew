"use client";

import Image from 'next/image';
import styles from './page.module.css';
import { useEffect } from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { FaClock, FaUserAlt, FaBullseye } from 'react-icons/fa';
import dynamic from 'next/dynamic';

const services = [
  {
    title: '디지털 교육',
    description: '최신 디지털 교육 프로그램을 제공합니다.',
    icon: '/images/service1.png'
  },
  {
    title: '코딩 교육',
    description: '다양한 코딩 교육 과정을 통해 프로그래밍 능력을 배양합니다.',
    icon: '/images/service2.png'
  },
  {
    title: '창의적 체험활동',
    description: '창의적 사고를 기르는 체험활동을 제공합니다.',
    icon: '/images/service3.png'
  },
  {
    title: '진로체험 교육',
    description: '학생들의 진로 선택을 돕는 다양한 체험 교육을 제공합니다.',
    icon: '/images/service4.png'
  },
  {
    title: '온라인 강의',
    description: '언제 어디서나 접근 가능한 온라인 강의를 제공합니다.',
    icon: '/images/service5.png'
  }
];

const feedbacks = [
  {
    image: '/images/feedback1.jpg',
    name: '김철수',
    job: 'OO초등학교 교사',
    feedback: '브레인스파크의 코딩 교육을 통해 많은 것을 배웠습니다.'
  },
  {
    image: '/images/feedback2.jpg',
    name: '이영희',
    job: 'OO초등학교 교사',
    feedback: '진로체험 교육이 정말 유익했습니다.'
  },
  {
    image: '/images/feedback3.jpg',
    name: '박민수',
    job: 'OO초등학교 학생',
    feedback: '창의적 체험활동을 통해 창의력을 키울 수 있었습니다.'
  },
  {
    image: '/images/feedback4.jpg',
    name: '최영수',
    job: 'OO초등학교 학생',
    feedback: '디지털 교육 프로그램이 매우 유익했습니다.'
  }
];

const programs = [
  {
    title: '프로그램 1',
    description: '프로그램 1에 대한 설명입니다.',
    image: '/images/program1.png',
    time: '3시간',
    people: '20명',
    target: '중학생'
  },
  {
    title: '프로그램 2',
    description: '프로그램 2에 대한 설명입니다.',
    image: '/images/program2.png',
    time: '2시간',
    people: '25명',
    target: '고등학생'
  },
  {
    title: '프로그램 3',
    description: '프로그램 3에 대한 설명입니다.',
    image: '/images/program3.png',
    time: '1.5시간',
    people: '30명',
    target: '초등학생'
  },
  {
    title: '프로그램 4',
    description: '프로그램 4에 대한 설명입니다.',
    image: '/images/program4.png',
    time: '4시간',
    people: '15명',
    target: '대학생'
  },
  {
    title: '프로그램 5',
    description: '프로그램 5에 대한 설명입니다.',
    image: '/images/program5.png',
    time: '3시간',
    people: '20명',
    target: '교사'
  },
  {
    title: '프로그램 6',
    description: '프로그램 6에 대한 설명입니다.',
    image: '/images/program6.png',
    time: '2.5시간',
    people: '10명',
    target: '일반인'
  }
];

const schools = [
  { image: '/images/school1.png', name: '서울초등학교' },
  { image: '/images/school2.png', name: '부산중학교' },
  { image: '/images/school3.png', name: '대구고등학교' },
  { image: '/images/school4.png', name: '인천초등학교' },
  { image: '/images/school5.png', name: '광주중학교' },
  { image: '/images/school6.png', name: '대전고등학교' },
  { image: '/images/school7.png', name: '울산초등학교' },
  { image: '/images/school8.png', name: '세종중학교' },
  { image: '/images/school9.png', name: '경기고등학교' },
  { image: '/images/school10.png', name: '강원초등학교' },
  { image: '/images/school11.jpg', name: '충북중학교' },
  { image: '/images/school12.png', name: '전북고등학교' }
];


const Home = () => {
  useEffect(() => {
    // 애니메이션 추가 스크립트
    const scrollers = document.querySelectorAll<HTMLElement>(".scroller");

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      addAnimation();
    }

    function addAnimation() {
      scrollers.forEach((scroller) => {
        // add data-animated="true" to every `.scroller` on the page
        scroller.setAttribute("data-animated", "true");

        // Make an array from the elements within `.scroller-inner`
        const scrollerInner = scroller.querySelector<HTMLElement>(".scroller__inner");
        if (scrollerInner) {
          const scrollerContent = Array.from(scrollerInner.children);

          // For each item in the array, clone it
          // add aria-hidden to it
          // add it into the `.scroller-inner`
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
            {services.map((service, index) => (
              <div key={index} className={styles.service}>
                <img src={service.icon} alt={service.title} className={styles.serviceImage} />
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            ))}
          </Carousel>
        </section>

        <section className={styles.feedbacks}>
          <h2>브레인스파크와 함께한 교육</h2>
          <div className={styles.feedbackList}>
            {feedbacks.map((feedback, index) => (
              <div key={index} className={`${styles.feedback} ${styles[`feedback${index % 5}`]}`}>
                <img src={feedback.image} alt={feedback.name} className={styles.feedbackImage} />
                <h3>{feedback.name}</h3>
                <p>{feedback.job}</p>
                <p>{feedback.feedback}</p>
              </div>
            ))}
          </div>
          <div className="schoolcontainer">
            <ul className={styles.banner}>
              {schools.concat(schools).map((school, index) => (
                <li key={index} className={styles.box}>
                  <img src={school.image} alt={school.name} className={styles.schoolImage} />
                  <p>{school.name}</p>
                </li>
              ))}
            </ul>
          </div>

          <section className={styles.blog}>
          <div className={styles.blogList}>
            <div className={styles.blogItem}>
              <img src="/images/blog1.png" alt="Blog 1" className={styles.blogImage} />
              <h3>블로그 제목 1</h3>
              <p>블로그 내용 1</p>
              <a href="/blog/1">더 보기</a>
            </div>
            <div className={styles.blogItem}>
              <img src="/images/blog2.png" alt="Blog 2" className={styles.blogImage} />
              <h3>블로그 제목 2</h3>
              <p>블로그 내용 2</p>
              <a href="/blog/2">더 보기</a>
            </div>
          </div>
        </section>


        </section>

        <section className={styles.programs}>
          <h2>교육 프로그램</h2>
          <div className={styles.programList}>
            {programs.map((program, index) => (
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
            <div className={styles.line}></div>
          </div>
        </section>


        <section className={styles.faq}>
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
        </section>

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
