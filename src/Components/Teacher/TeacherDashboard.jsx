import React from 'react'
import { Link } from 'react-router-dom'
import TeacherSidebar from './TeacherSidebar'
import { useEffect } from 'react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import Swal from 'sweetalert2'

const baseUrl='https://minipro.pythonanywhere.com/api'

const TeacherDashboard = () => {
  useEffect(()=>{
    document.title='LMS | Teacher DashBoard'
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, []) 
  
  const [dashbarData,setDashbarData]=useState([])
  const teacherId=localStorage.getItem('teacherId')

  useEffect(()=>{
    try{
      axios.get(baseUrl+'/teacher/dashboard/'+teacherId)
      .then((res)=>{
        setDashbarData(res.data)
      })
    }catch(error){
      console.log(error)
    }
  },[]);

  return (
    <div className='container mt-4'>
        <div className='row'>
            <aside className='col-md-3'>
                <TeacherSidebar />
            </aside>
            <section className='col-md-9'>
                <div className='row mt-3'>
                  <h4>Dashboard</h4>
                  <div className='col-md-4 mt-3'>
                    <div className='card border-primary'>
                      <h5 className='card-header bg-warning text-white'>Total Courses</h5>
                      <div className='card-body'>
                        <h3><Link to="/teacher-my-course" className='text-warning'>{dashbarData.total_teacher_course} <i class="bi bi-journals text-warning"></i></Link></h3>
                      </div>
                    </div>
                  </div>
                  <div className='col-md-4 mt-3'>
                    <div className='card border-primary'>
                      <h5 className='card-header bg-success text-white'>Total Students</h5>
                      <div className='card-body'>
                        <h3><Link to="/my-users" className='text-success'>{dashbarData.total_teacher_students} <i class="bi bi-people-fill"></i></Link></h3>
                      </div>
                    </div>
                  </div>
                  <div className='col-md-4 mt-3'>
                    <div className='card border-primary'>
                      <h5 className='card-header bg-info text-white'>Total Chapters</h5>
                      <div className='card-body'>
                        <h3><Link to="/teacher-my-course">{dashbarData.total_teacher_chapters} <i class="bi bi-stickies-fill"></i></Link></h3>
                      </div>
                    </div>
                  </div>
                </div>
            </section>
        </div>


    </div>
  )
}

export default TeacherDashboard
