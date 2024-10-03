import React from 'react'
import { Link } from 'react-router-dom'
import TeacherSidebar from './TeacherSidebar'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import './course.css'

const baseUrl='https://minipro.pythonanywhere.com/api'

const TeacherMyCourses = () => {
    useEffect(()=>{
        document.title='LMS | Uploaded Courses'
      })

      const [courseData, setCourseData]=useState([]);
      const teacherId=localStorage.getItem('teacherId');
      const [totalResult, settotalResult]=useState([0]);    

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

      const handleDeleteClick = (course_id) =>{
        Swal.fire({
            title: 'Confirm',
            text: 'Are you sure you want to delete data?',
            icon: 'info',
            confirmButtonText: 'Continue',
            showCancelButton:true
          }).then((result)=>{
            if(result.isConfirmed){
                try{
                    axios.delete(baseUrl+'/teacher-course-detail/'+course_id)
                    .then((res)=>{
                        Swal.fire('success','Data has been deleted Successfully')
                        try{
                            axios.get(baseUrl+'/teacher-course/'+teacherId)
                            .then((res)=>{
                              settotalResult(res.data.length)
                              setCourseData(res.data)
                            });
                        }catch(error){
                            console.log(error);
                        }
                    })
            }catch(error){
                Swal.fire('error','Data has not been deleted !!');
            }
            }
            else{
                Swal.fire('error','Data has not been deleted !!');
            }
          })
    }
    useEffect(() => {
        window.scrollTo(0, 0)
      }, [])
  return (
    <div className='container mt-4'>
        <div className='row'>
            <aside className='col-md-3'>
                <TeacherSidebar />
            </aside>
            <section className='col-md-9'>
                <div className='card'>
                    <h5 className='card-header'><i class="bi bi-journals"></i> My Courses</h5>
                    <div className='card-body' class="table-responsive">
                        <table className='table table-striped table-hover'>
                            <thead>
                                <tr>
                                    <th className='text-center'>Name</th>
                                    <th className='text-center'>Thumbnail</th>
                                    <th className='text-center'>Total Enrolled</th>
                                    <th className='text-center'>Ratings</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courseData.map((course,index) => 
                                    <tr>
                                    <td className='text-center'>
                                        <Link to={`/all-chapters/` +course.id}>{course.title}</Link>
                                        <hr />
                                        <i class="bi bi-star-fill text-warning"></i>&nbsp;
                                        {course.course_rating && 
                                            <span>Rating : {course.course_rating}/5</span>
                                        }
                                        {!course.course_rating && 
                                            <span>Rating : 0/5</span>
                                        }
                                    </td>
                                    <td className='text-center'><img className='round' src={course.featured_img} width="80 " alt={course.title}/></td>
                                    <td className='text-center'><Link to={`/enrolled-students/`+course.id} >&nbsp;{course.total_enrolled_students}  <i class="bi bi-people-fill"></i></Link></td> 
                                    <td className='text-center'>
                                        <Link to={`/edit-course/` +course.id} className='btn btn-secondary btn-sm ms-2  mb-2'><i class="bi bi-pencil-square"></i></Link>
                                        <Link to={`/study-material/` +course.id} className='btn btn-primary btn-sm ms-2 mb-2'>Study Material</Link>
                                        <Link to={`/add-chapter/` +course.id} className='btn btn-success btn-sm ms-2 mb-2'>Add Chapter</Link>
                                        <button onClick={()=>handleDeleteClick(course.id)} className='btn btn-danger btn-sm ms-2 mb-2'><i class="bi bi-trash"></i></button>
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

export default TeacherMyCourses
