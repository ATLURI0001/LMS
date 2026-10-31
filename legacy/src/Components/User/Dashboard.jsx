import React from 'react'
import { Link } from 'react-router-dom'
import Sidebar from './/Sidebar'
import { useEffect } from 'react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import Swal from 'sweetalert2'

const baseUrl='https://minipro.pythonanywhere.com/api'

const Dashboard = () => {
  useEffect(()=>{
    document.title='LMS | Teacher DashBoard'
  })

  const [dashbarData,setDashbarData]=useState([])
  const studentId=localStorage.getItem('studentId')

  useEffect(()=>{
    try{
      axios.get(baseUrl+'/student/dashboard/'+studentId)
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
                <Sidebar />
            </aside>
            <section className='col-md-9'>
                <div className='row mt-3'>
                  <h4>Dashboard</h4>
                  <div className='col-md-4 pt-3'>
                    <div className='card border-primary'>
                      <h5 className='card-header bg-warning text-white'>Enrolled Courses</h5>
                      <div className='card-body'>
                        <h3><Link to="/my-courses" className='text-warning'>{dashbarData.enrolled_courses} <i class="bi bi-cart-check-fill"></i></Link></h3>
                      </div>
                    </div>
                  </div>
                  <div className='col-md-4 pt-3'>
                    <div className='card border-primary'>
                      <h5 className='card-header bg-success text-white'>Favorite Courses</h5>
                      <div className='card-body'>
                        <h3><Link to="/favorite-courses" className='text-success'>{dashbarData.favorite_courses} <i class="bi bi-heart-fill text-success"></i></Link></h3>
                      </div>
                    </div>
                  </div>
                  <div className='col-md-4 pt-3'>
                    <div className='card border-primary'>
                      <h5 className='card-header bg-info text-white'>Completed Assignment</h5>
                      <div className='card-body'>
                        <h3><Link to="/my-assignments">{dashbarData.complete_assignments} <i class="bi bi-journal-check"></i></Link></h3>
                      </div>
                    </div>
                  </div>
                  <div className='col-md-4 pt-3'>
                    <div className='card border-primary'>
                      <h5 className='card-header bg-danger text-white'>Pending Assignment</h5>
                      <div className='card-body'>
                        <h3><Link to="/my-assignments" className='text-danger'>{dashbarData.pending_assignments} <i class="bi bi-journal-x"></i></Link></h3>
                      </div>
                    </div>
                  </div>
                </div>
            </section>
        </div>


    </div>
  )
}

export default Dashboard
