import React from 'react'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import Stars from './Stars'
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";
import './Header.css'
import wave from './darkside.mp4'
import './main.css'
import ab from './about.jpg'
import './search.css'

const baseUrl='https://minipro.pythonanywhere.com/api'

const Home = () => {
  useEffect(()=>{
    document.title='Edu Learning'
  })

  const icon={
    'font-size':'20px'
  } 

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const [courseData, setCourseData]=useState([]);
  const [popularcourseData,setPopularcourseData]=useState([]);
  const [popularteacherData,setPopularteacherData]=useState([]);
  const [testData,setTestData]=useState([]);

  useEffect(()=>{
    try{
        axios.get(baseUrl+'/course/?result=3')
        .then((res)=>{
            setCourseData(res.data.results)
        });
    }catch(error){
        console.log(error)
    }

    try{
      axios.get(baseUrl+'/popular-teachers/?popular=1')
      .then((res)=>{
        setPopularteacherData(res.data)
      });
  }catch(error){
      console.log(error)
  }

  try{
    axios.get(baseUrl+'/popular-courses/?popular=1')
    .then((res)=>{
      setPopularcourseData(res.data.results)
    });
}catch(error){
    console.log(error)
}

try{
  axios.get(baseUrl+'/student-test/')
  .then((res)=>{
    setTestData(res.data.results)
  });
}catch(error){
  console.log(error)
}
    
  },[]);

  const teacherLoginStatus=localStorage.getItem('teacherLoginStatus')
  const studentLoginStatus=localStorage.getItem('studentLoginStatus')
  
  const [searchString,setSearchString]=useState({
    'search':'',
  })

  const handleChange=(event)=>{
    setSearchString({
      ...searchString,
      [event.target.name]:event.target.value
    });
  }
  
  return (
    <>
      {/* Start Background video player*/}
    <section class="showcase">
    <video src={wave} autoPlay muted loop />
    <div class="overlay"></div>
    <div class="text">
      <h1 className='head'>Never stop learning.<br/> Never stop growing.</h1> 
      <h1 className='headss'>Learn with Us!</h1>
      <p className='para'>Learn from the top Instructor over the World.<br/>Learn the latest Technology Trend.</p>
    </div>
    </section>
      {/*  End Background video player*/}
      {/*  Start Features of meetLearning*/}
    <div class="container-xxl py-5" className='space'>
        <div class="container">
            <div class="row g-4">
                <div class="col-lg-3 col-sm-6 wow fadeInUp" data-wow-delay="0.1s">
                    <div class="service-item text-center pt-3">
                        <div class="p-4">
                            <i class="fa fa-3x fa-graduation-cap text-primary mb-4"></i>
                            <h5 class="mb-3">Skilled Instructors</h5>
                            <p>Our Instructors Says: <br/>If you are planning for a year, sow rice; if you are planning for a decade, plant trees; if you are planning for a lifetime, educate people.</p>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-sm-6 wow fadeInUp" data-wow-delay="0.3s">
                    <div class="service-item text-center pt-3">
                        <div class="p-4">
                            <i class="fa fa-3x fa-globe text-primary mb-4"></i>
                            <h5 class="mb-3">Online Courses</h5>
                            <p>The most profound words will remain unread unless you can keep the learner engaged. You can't see their eyes to know if they got it so … say it, show it, write it, demo it and link it to an activity.</p>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-sm-6 wow fadeInUp" data-wow-delay="0.5s">
                    <div class="service-item text-center pt-3">
                        <div class="p-4">
                            <i class="fa fa-3x fa-home text-primary mb-4"></i>
                            <h5 class="mb-3">Home Assignments</h5>
                            <p>To Prepare all our students for future. Instructors provides best quality Assignments for practice. Assignments which include all chapters Question for better understand of the entire Course.</p>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-sm-6 wow fadeInUp" data-wow-delay="0.7s">
                    <div class="service-item text-center pt-3">
                        <div class="p-4">
                            <i class="fa fa-3x fa-book-open text-primary mb-4"></i>
                            <h5 class="mb-3">Best Study Material</h5>
                            <p>With our quality study material any can achieve their goal and with the top instructors nothing can stop you. At the Time of Exam any student can refer the study material and ace any exam or interview.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
      {/*  End Features of meetLearning*/}
      {/*  About Us card */}
    <div class="container-xxl py-5">
        <div class="container">
            <div class="row g-5">
                <div class="col-lg-6 wow fadeInUp" data-wow-delay="0.1s" >
                    <div class="position-relative h-100">
                        <img class="img-fluid position-absolute w-100 h-100" src={ab}/>
                    </div>
                </div>
                <div class="col-lg-6 wow fadeInUp" data-wow-delay="0.3s">
                    <h6 class="section-title bg-white text-start text-primary pe-3">About Us</h6>
                    <h1 class="mb-4">Welcome to eduLEARNING</h1>
                    <p class="mb-4">Students do not learn much just sitting in classes listening to teachers, memorizing prepackaged assignments, and spitting out answers. They must talk about what they are learning, write reflectively about it, relate it to past experiences, and apply it to their daily lives. They must make what they learn part of themselves.</p>
                    <p class="mb-4">It’s time to step up to the plate and get passionate about your work commit to making eLearning courses that don't bore people to tears, but instead inspire and motivate them to learn a new skill, change a certain behavior, or improve their performance..</p>
                    <div class="row gy-2 gx-4 mb-4"> 
                        <div class="col-sm-6">
                            <p class="mb-0"><i class="fa fa-arrow-right text-primary me-2"></i>Skilled Instructors</p>
                        </div>
                        <div class="col-sm-6">
                            <p class="mb-0"><i class="fa fa-arrow-right text-primary me-2"></i>Online Courses</p>
                        </div>
                        <div class="col-sm-6">
                            <p class="mb-0"><i class="fa fa-arrow-right text-primary me-2"></i>Chat with Teachers</p>
                        </div>
                        <div class="col-sm-6">
                            <p class="mb-0"><i class="fa fa-arrow-right text-primary me-2"></i>Get Study Materials</p>
                        </div>
                        <div class="col-sm-6">
                            <p class="mb-0"><i class="fa fa-arrow-right text-primary me-2"></i>Weekly Assignments</p>
                        </div>
                        <div class="col-sm-6">
                            <p class="mb-0"><i class="fa fa-arrow-right text-primary me-2"></i>Self-Learning</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
      {/*  About Us card */}
      <div class="input-box container">
          <i class="bi bi-search text-info"></i>
          <input name='search' type="search" onChange={handleChange} placeholder="Search here..." aria-label="Search" />
          <Link className='button' to={'/search/'+searchString.search} type="button">Search</Link>
      </div>

    <div className='container mt-4'>
      {/* Start Latest Courses*/}
    <div class="container-xxl py-5">
        <div class="container">
            <div class="text-center wow fadeInUp">
                <h6 class="section-title bg-white text-center text-primary px-3">Courses</h6>
                <h1 class="mb-5">Latest Courses </h1>
            </div>
            <div class="row g-4 justify-content-center">
            {courseData && courseData.map((course,index) =>
                <div class="col-lg-4 col-md-6 wow fadeInUp">
                    <div class="course-item bg-light">
                        <div class="position-relative overflow-hidden">
                        <Link to={`/detail/${course.id}`}><img src={course.featured_img} height={250}  className="card-img-top" alt={course.title} /></Link>                        </div>
                        <div class="text-center p-4 pb-0">
                            <h5 className="mb-4"><Link to={`/detail/${course.id}`}>{course.title}</Link></h5>
                        </div>
                        <div class="d-flex border-top">
                            <small class="flex-fill text-center border-end py-2"><i class="fa fa-user-tie text-primary me-2"></i>{course.teacher.full_name}</small>                            <small class="flex-fill text-center py-2"><i class="fa fa-user text-primary me-2"></i>{course.total_enrolled_students}</small>
                        </div>
                    </div>
                </div>
                )}
            </div>
        </div>
    </div>
    <div class="text-center">
    <button type="button" class="btn btn-primary border border-primary"><Link to='/all-courses'className='text-white' >View More</Link></button>
    </div>
      {/* ENd Latest Courses*/}
      {/* popular Courses*/}
    <div class="container-xxl py-5">
        <div class="container">
            <div class="text-center wow fadeInUp">
                <h6 class="section-title bg-white text-center text-primary px-3">Courses</h6>
                <h1 class="mb-5">Popular Courses</h1>
            </div>
            <div class="row g-4 justify-content-center">
            {popularcourseData && popularcourseData.map((row,index)=>
                <div class="col-lg-4 col-md-6 wow fadeInUp">
                    <div class="course-item bg-light">
                        <div class="position-relative overflow-hidden">
                            <Link to={`/detail/${row.course.id}`}><img src={row.course.featured_img} height={250}  className="card-img-top" alt={row.course.title}/></Link>
                        </div>
                        <div class="text-center p-4 pb-0">
                            <h5 className="mb-4"><Link to={`/detail/${row.course.id}`}>{row.course.title}</Link></h5>
                        </div>
                        <div class="d-flex border-top">
                            <small class="flex-fill text-center border-end py-2"><i class="fa fa-user-tie text-primary me-2"></i>{row.course.teacher.full_name}</small>
                            <small class="flex-fill text-center border-end py-2"><Stars stars={row.rating}/></small>
                            <small class="flex-fill text-center py-2"><i class="fa fa-eye text-primary me-2"></i>{row.course.course_views}</small>
                        </div>
                    </div>
                </div>
                )}
            </div>
        </div>
    </div>
    <div class="text-center">
    <button type="button" class="btn btn-primary border border-primary"><Link to='/popular-courses' className='text-white'>View More</Link></button>
    </div>
      {/* ENd Popular Courses*/}
      {/* Popular Teacher */}
    <div class="container-xxl py-5">
        <div class="container">
            <div class="text-center wow fadeInUp">
                <h6 class="section-title bg-white text-center text-primary px-3">Instructors</h6>
                <h1 class="mb-5">Popular Instructors</h1>
            </div>
            <div class="row g-4">
            {popularteacherData && popularteacherData.map((teacher,index)=>
                <div class="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="0.1s">
                    <div class="team-item bg-light">
                        <div class="overflow-hidden">
                          <Link className='front' to={`/teacher-detail/${teacher.id}`}><img src={teacher.profile_img} height={330} className="card-img-top" alt={teacher.full_name}/></Link>
                        </div>
                        <div class="position-relative d-flex justify-content-center">
                            <div class="bg-light d-flex justify-content-center pt-2 px-1 mt-1">
                            {teacher.insta_url &&
                              <a class="btn btn-sm-square btn-primary mx-1" href={teacher.insta_url}><i class="fab fa-instagram"></i></a>
                            }
                            {teacher.twit_url &&
                              <a class="btn btn-sm-square btn-primary mx-1" href={teacher.twit_url}><i class="fab fa-twitter"></i></a>
                            }
                            {teacher.face_url &&
                              <a class="btn btn-sm-square btn-primary mx-1" href={teacher.face_url}><i class="fab fa-facebook"></i></a>
                            }
                        </div>
                        </div>
                        <div class="text-center p-4">
                        <h4 className="card-title mb-0 "><Link to={`/teacher-detail/${teacher.id}`}>{teacher.full_name}</Link></h4>                            
                        <p className='mb-0'>{teacher.qualification}</p>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    </div>
      {/* ENd Popular Teacher Courses*/}
      {/* Student Testimonial */}
    <div class="text-center wow fadeInUp">
                <h6 class="section-title bg-white text-center text-primary px-3">What our Student Says!</h6>
                <h1 class="mb-5">Student Testimonial</h1>
        </div>
    <div>
      <Carousel
        showArrows={true}
        infiniteLoop={true}
        showThumbs={false}
        showStatus={false}
        autoPlay={true}
        interval={5500}
        showIndicators={false}
      >
      {testData && testData.map((row,i)=>
        <div>
            <img src={row.student.profile_img} />
          <>
          <div className="myCarousel">
            <names>{row.course.fullname}</names>
            <titles>{row.course.title}</titles>
            <p>{row.reviews}</p>
            <a>--{row.student.fullname}</a>
          </div>
          </>
        </div>
        )}
      </Carousel>
    </div>
      {/* ENd Student Testimonial*/}
    </div>
    </>
  )
}

export default Home