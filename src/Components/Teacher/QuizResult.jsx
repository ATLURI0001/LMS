import React from 'react'
import { Link, useParams } from 'react-router-dom'
import TeacherSidebar from './TeacherSidebar'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'

const baseUrl='https://minipro.pythonanywhere.com/api'

const QuizResult = (props) => {
    useEffect(()=>{
        document.title='LMS | All Quiz'
      })

      const [resultData, setResultData]=useState([]);

      useEffect(()=>{
        try{
            axios.get(`${baseUrl}/fetch-quiz-result/${props.quiz}/${props.student}`)
            .then((res)=>{
                setResultData(res.data)
            });
        }catch(error){
            console.log(error)
        }
    
    },[]);

  return (
    <>
    <div className="modal-dialog">
        <div className="modal-content">
        <div className="modal-header">
            <h5 className="modal-title" id="exampleModalLabel">Quiz Result</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div className="modal-body">
            <table className='table table-bordered'>
                <tr>
                    <td>Total Questions</td>
                    <td>{resultData.total_questions}</td>
                </tr>
                <tr>
                    <td>Attempted Questions</td>
                    <td>{resultData.total_attempted_questions}</td>
                </tr>
                <tr>
                    <td>Marks obtained</td>
                    <td>{resultData.total_correct_questions}</td>
                </tr>
            </table>
        </div>
        </div>
    </div>
    </>
  )
}

export default QuizResult


