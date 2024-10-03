import React from 'react'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'

const baseUrl='https://minipro.pythonanywhere.com/api/popular-courses/?all=1'

const PopularCourses = () => {
  useEffect(()=>{
    document.title='LMS | Popular Courses'
  })

  const [courseData, setCourseData]=useState([]);
  const [nextUrl, setNextUrl]=useState();
  const [previousUrl, setPreviousUrl]=useState();

  useEffect(()=>{
    fetchData(baseUrl)
  },[]);

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

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

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  
  return (
    <div className='container mt-4 '>
<div class="text-center wow fadeInUp">
                <h6 class="section-title bg-white text-center text-primary px-3">Courses</h6>
                <h1 class="mb-5">Popular Courses</h1>
            </div>        <div className='row mb-4'>
      {courseData && courseData.map((row,index) =>
      <div className='col-md-3 mb-4'>
        <div className="card">
          <Link to={`/detail/${row.course.id}`}><img src={row.course.featured_img} height={200}  className="card-img-top" alt={row.course.title} /></Link>
          <div className="card-body">
            <h5 className="card-title"><Link to={`/detail/${row.course.id}`}>{row.course.title}</Link></h5>
          </div>
        </div>
      </div>
      )}
    </div>
    <nav aria-label="Page navigation example mt-3">
      <ul className="pagination justify-content-center">
        {previousUrl &&
          <li className='page-item'><button className='page-link rounded-pill ms-2' onClick={()=>paginationHandler(previousUrl)}><i className='bi bi-arrow-left'></i>&nbsp; Previous</button></li>
        }
        {nextUrl &&
          <li className='page-item'><button className='page-link rounded-pill ms-2' onClick={()=>paginationHandler(nextUrl)}>Next &nbsp;<i className='bi bi-arrow-right'></i></button></li>
        }
      </ul>
    </nav>
    </div>
  )
}

export default PopularCourses
