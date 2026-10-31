import React from 'react'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'

const baseUrl='https://minipro.pythonanywhere.com/api/course/'

const AllCourses = () => {

  const [courseData, setCourseData]=useState([]);
  const [nextUrl, setNextUrl]=useState();
  const [previousUrl, setPreviousUrl]=useState();

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(()=>{
    document.title='LMS | Latest Courses'
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

      useEffect(()=>{
        fetchData(baseUrl)
      },[]);

      const paginationHandler = (url) =>{
        fetchData(url)
      }

      function fetchData(url){
        try{
          axios.get(url)
          .then((res)=>{
              setNextUrl(res.data.next)
              setPreviousUrl(res.data.previous)
              setCourseData(res.data.results)
          });
        }catch(error){
          console.log(error)
        }
      }

  return (
    <div className='container mt-4'>
    <div class="text-center wow fadeInUp">
                <h6 class="section-title bg-white text-center text-primary px-3">Courses</h6>
                <h1 class="mb-5">All Courses</h1>
    </div>    <div className='row mb-4'>
      {courseData && courseData.map((course,index) =>
      <div className='col-md-3 mb-4'>
        <div className="card">
          <Link to={`/detail/${course.id}`}><img src={course.featured_img} height={200}  className="card-img-top" alt={course.title} /></Link>
          <div className="card-body">
            <h5 className="card-title"><Link to={`/detail/${course.id}`}>{course.title}</Link></h5>
          </div>
        </div>
      </div>
      )}
    </div>

  <nav aria-label="Page navigation example mt-3">
  <ul className="pagination justify-content-center">
    {previousUrl &&
        <li className='page-item '><button className='page-link ms-2 rounded-pill' onClick={()=>paginationHandler(previousUrl)}><i className='bi bi-arrow-left'></i>Previous</button></li>
    }
    {nextUrl &&
        <li className='page-item'><button className='page-link ms-2 rounded-pill' onClick={()=>paginationHandler(nextUrl)}>Next<i className='bi bi-arrow-right'></i></button></li>
    }
  </ul>
  </nav>
  </div>
  )
}

export default AllCourses
