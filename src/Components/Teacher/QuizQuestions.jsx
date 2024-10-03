import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import { Params } from 'react-router-dom'
import Swal from 'sweetalert2'
import TeacherSidebar from './TeacherSidebar'

const baseUrl='https://minipro.pythonanywhere.com/api'

const QuizQuestions = () => {

    const [totalResult,setTotalResult]=useState(0)
    const [questionData,setQuestionData]=useState([])
    const {quiz_id}=useParams();

    useEffect(()=>{
        try{
            axios.get(baseUrl+'/quiz-questions/'+quiz_id)
            .then((res)=>{
                setTotalResult(res.data.length)
                setQuestionData(res.data)
            });
        }catch(error){
            console.log(error)
        }
        document.title='LMS | Course Quiz'
      },[]);

      const handleDeleteClick = (question_id) =>{
        Swal.fire({
            title: 'Confirm',
            text: 'Are you sure you want to delete data?',
            icon: 'info',
            confirmButtonText: 'Continue',
            showCancelButton:true
          }).then((result)=>{
            if(result.isConfirmed){
                try{
                    axios.delete(baseUrl+'/question/'+question_id)
                    .then((res)=>{
                        Swal.fire('success','Data has been deleted Successfully')
                        try{
                            axios.get(baseUrl+'/quiz-questions/'+quiz_id)
                            .then((res)=>{
                                setTotalResult(res.data.length)
                                setQuestionData(res.data)
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

  return (
    <div className='container mt-4'>
        <div className='row'>
            <aside className='col-md-3'>
                <TeacherSidebar />
            </aside>
            <section className='col-md-9'>
                <div className='card'>
                    <h5 className='card-header'>Quiz List</h5>
                    <div className='card-body'>
                        <table className='table table-bordered'>
                            <thead>
                                <tr>
                                    <th>Question</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {questionData.map((row,index) =>
                                <tr>
                                    <td><Link to={`/edit-question/`+row.id}>{row.questions}</Link></td>
                                    <td>
                                        <Link className='btn btn-sm text-white btn-info' to={`/edit-question/`+row.id}><i className="bi bi-pencil-square"></i></Link>
                                        <button className='btn btn-sm btn-danger ms-1' onClick={()=>handleDeleteClick(row.id)}><i className='bi bi-trash'></i></button>
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

export default QuizQuestions
