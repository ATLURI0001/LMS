import React from 'react'
import { Link, useParams } from 'react-router-dom'
import TeacherSidebar from './TeacherSidebar'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import CheckQuizCourse from './CheckQuizCourse'

const baseUrl='https://minipro.pythonanywhere.com/api'

const AssignQuiz = () => {
    useEffect(()=>{
        document.title='LMS | All Quiz'
      })

      const [quizData, setQuizData]=useState([]);
      const [courseData, setCoursezData]=useState([]);
      const teacherId=localStorage.getItem('teacherId');
      const {course_id}=useParams() 

      useEffect(()=>{
        try{
            axios.get(baseUrl+'/teacher-quiz/'+teacherId)
            .then((res)=>{
                setQuizData(res.data)
            });
        }catch(error){
            console.log(error)
        }

        try{
            axios.get(baseUrl+'/course/'+course_id)
            .then((res)=>{
                setCoursezData(res.data)
            });
        }catch(error){
            console.log(error)
        }
        
      },[]);

      const assignQuiz = (quiz_id) =>{
        const _formData=new FormData();
        _formData.append('teacher',teacherId);
        _formData.append('course',course_id);
        _formData.append('quiz',quiz_id);

        try{
            axios.post(baseUrl+'/quiz-assign-course/',_formData,{
                headers: {
                    'content-type':'multipart/form-data'
                }
            })
            .then((res)=>{
              if(res.status==200 || res.status==201){
                Swal.fire({
                    title:' Successfully Assigned a Quiz!',
                    icon:'success',
                    toast:true,
                    timer:3000,
                    position:'top-right',
                    timerProgressBar: true,
                    showConfirmButton: false
                });
            }
            });
        }catch(error){
            console.log(error);
        }
    }
      

  return (
    <div className='container mt-4'>
        <div className='row'>
            <aside className='col-md-3'>
                <TeacherSidebar />
            </aside>
            <section className='col-md-9'>
                <div className='card'>
                    <h5 className='card-header'> Assign Quiz for {courseData.title}</h5>
                    <div className='card-body'>
                        <table className='table table-bordered'>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quizData.map((row,index) => 
                                    <tr>
                                    <td>
                                        <Link to={`/all-questions/` +row.id}>{row.title}</Link>
                                    </td>
                                        <CheckQuizCourse quiz={row.id} course={course_id} />
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

export default AssignQuiz

