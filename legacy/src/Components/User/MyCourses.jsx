import React from 'react'
import { Link, useParams } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'

const baseUrl='https://minipro.pythonanywhere.com/api'

const MyCourses = () => {

    const studentId=localStorage.getItem('studentId')
    const [courseData,setCourseData]=useState([])

    useEffect(()=>{
        try{
            axios.get(baseUrl+'/fetch-enrolled-courses/'+studentId)
            .then((res)=>{
                setCourseData(res.data)
            });
        }catch(error){
            console.log(error)
        }
      },[]);

    useEffect(()=>{
        document.title='LMS | My Courses'
      })
  return (
    <div className='container mt-4'>
        <div className='row'>
            <aside className='col-md-3'>
                <Sidebar />
            </aside>
            <section className='col-md-9'>
                <div className='card'>
                    <h5 className='card-header'><i class="bi bi-journals"/> My Courses</h5>
                    <div className='card-body table-responsive'>
                        <table className='table table-striped table-hover'>
                            <thead>
                                <tr>
                                    <th  className='text-center'>Created By</th>
                                    <th className='text-center'>Course Name</th>
                                    <th  className='text-center'>Instructor</th>
                                    <th  className='text-center'>Materials</th>
                                </tr>
                            </thead>
                            <tbody>
                            {courseData.map((row,index) =>
                                <tr>
                                    <td  className='text-center'><Link to={`/teacher-detail/`+row.course.teacher.id}><img className='imgmeet' src={row.course.teacher.profile_img}/></Link></td>
                                    <td  className='text-center'><Link to={`/detail/`+row.course.id}>{row.course.title}</Link></td>
                                    <td className='text-center'>{row.course.teacher.full_name}</td>
                                    <td  className='text-center'>
                                        <Link to={`/user/study-material/` +row.course.id} className='btn text-white btn-sm btn-info mb-2 me-2'>Study Material</Link>
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    </div>
  )
}

export default MyCourses
