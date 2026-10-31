import React from 'react'
import { Link, useParams } from 'react-router-dom'
import TeacherSidebar from './TeacherSidebar'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'

const baseUrl='https://minipro.pythonanywhere.com/api'

const EnrolledStudents = () => {

    useEffect(()=>{
        document.title='LMS | Enrolled Students'
      })

      const [studentData, setStudentData]=useState([]);
      const [courseData, setCourseData]=useState([]);
      const teacherId=localStorage.getItem('teacherId');
      let {course_id}=useParams();

      useEffect(()=>{
        try{
            axios.get(baseUrl+'/fetch-enrolled-students/'+course_id)
            .then((res)=>{
                setStudentData(res.data)
            });
        }catch(error){
            console.log(error)
        }
      },[]);

      useEffect(()=>{
        try{
            axios.get(baseUrl+'/teacher-course/'+teacherId)
            .then((res)=>{
                setCourseData(res.data)
            });
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
                <div className='card'>
                    <h5 className='card-header'><i class="bi bi-people-fill"></i> Enrolled List</h5>
                    <div className='card-body' class="table-responsive">
                        <table className='table table-striped table-hover'>
                            <thead>
                                <tr>
                                    <th className='text-center'>Profile</th>
                                    <th className='text-center'>Name</th>
                                    <th className='text-center'>Email</th>
                                    <th className='text-center'>Interest</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentData.map((row,index) => 
                                    <tr>
                                    <td className='text-center' scope="row"><img className='imgmeet' src={row.student.profile_img} /></td>
                                    <td className='text-center' scope="row">{row.student.fullname}</td>
                                    <td className='text-center w-auto' scope="row">{row.student.email}</td>
                                    <td className='text-center' scope="row">{row.student.interseted_categories}</td>
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

export default EnrolledStudents
