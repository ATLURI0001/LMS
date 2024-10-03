import React from 'react'
import { Link, useParams } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import CheckQuizStatusStudent from './CheckQuizStatusStudent'

const baseUrl='https://minipro.pythonanywhere.com/api'

const CourseQuizList = () => {

    const studentId=localStorage.getItem('studentId')
    const [quizData,setQuizData]=useState([])
    const {course_id}=useParams();
    
    useEffect(()=>{
        try{
            axios.get(baseUrl+'/fetch-assigned-quiz/'+course_id)
            .then((res)=>{
                setQuizData(res.data)
            });
        }catch(error){
            console.log(error)
        }
      },[]);

      useEffect(()=>{
        document.title='LMS | Course Quiz List'
      })

  return (
    <div className='container mt-4'>
        <div className='row'>
            <aside className='col-md-3'>
                <Sidebar />
            </aside>
            <section className='col-md-9'>
                <div className='card'>
                    <h5 className='card-header'>Quiz List</h5>
                    <div className='card-body'>
                        <table className='table table-bordered'>
                            <thead>
                                <tr>
                                    <th>Quiz</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quizData.map((row,index) =>
                                <tr>
                                    <td>{row.quiz.title}</td>
                                    <td><CheckQuizStatusStudent quiz={row.quiz.id} student={studentId}/></td>
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

export default CourseQuizList
