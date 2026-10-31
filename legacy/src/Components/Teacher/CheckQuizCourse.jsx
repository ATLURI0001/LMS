import React from 'react'
import { Link, useParams } from 'react-router-dom'
import TeacherSidebar from './TeacherSidebar'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'

const baseUrl='https://minipro.pythonanywhere.com/api'

const CheckQuizCourse = (props) => {
    useEffect(()=>{
        document.title='LMS | All Quiz'
      })

      const [quizData, setQuizData]=useState([]);
      const teacherId=localStorage.getItem('teacherId');

      useEffect(()=>{
        try{
            axios.get(`${baseUrl}/fetch-quiz-assign-status/${props.quiz}/${props.course}`)
            .then((res)=>{
                setQuizData(res.data)
            });
        }catch(error){
            console.log(error)
        }
    
    },[]);

      const assignQuiz = (quiz_id) =>{
        const _formData=new FormData();
        _formData.append('teacher',teacherId);
        _formData.append('course',props.course);
        _formData.append('quiz',props.quiz);

        try{
            axios.post(baseUrl+'/quiz-assign-course/',_formData,{
                headers: {
                    'content-type':'multipart/form-data'
                }
            })
            .then((res)=>{
              if(res.status==200 || res.status==201){
                window.location.reload();
                }
            });
        }catch(error){
            console.log(error);
        }
    }
      

  return (
    <td>
        {quizData.bool==false &&
            <button onClick={()=>assignQuiz(props.quiz)} className='btn btn-success btn-sm ms-2'>Assign Quiz</button>
        }
        {quizData.bool==true &&
        <>
            <span className='text-success'>Assigned</span>
            &nbsp;
            <Link className='btn btn-sm btn-info' to={`/attempted-students/`+props.quiz}>Attempted Students</Link>
        </>
        }
    </td>
  )
}

export default CheckQuizCourse


