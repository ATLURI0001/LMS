import React from 'react'
import { Link } from 'react-router-dom'
import TeacherSidebar from './TeacherSidebar'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'

const baseUrl='https://minipro.pythonanywhere.com/api'

const AllQuiz = () => {
    useEffect(()=>{
        document.title='LMS | All Quiz'
      })

      const [quizData, setQuizData]=useState([]);
      const teacherId=localStorage.getItem('teacherId');
      const [totalResult, settotalResult]=useState(0);    

      useEffect(()=>{
        try{
            axios.get(baseUrl+'/teacher-quiz/'+teacherId)
            .then((res)=>{
                setQuizData(res.data)
            });
        }catch(error){
            console.log(error)
        }
      },[]);

      const handleDeleteClick = (quiz_id) =>{
        Swal.fire({
            title: 'Confirm',
            text: 'Are you sure you want to delete data?',
            icon: 'info',
            confirmButtonText: 'Continue',
            showCancelButton:true
          }).then((result)=>{
            if(result.isConfirmed){
                try{
                    axios.delete(baseUrl+'/quiz/'+quiz_id)
                    .then((res)=>{
                        Swal.fire('success','Data has been deleted Successfully')
                        try{
                            axios.get(baseUrl+'/teacher-quiz/'+teacherId)
                            .then((res)=>{
                              settotalResult(res.data.length)
                              setQuizData(res.data)
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
                    <h5 className='card-header'> All Quiz</h5>
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
                                    <td>
                                        <Link to={`/edit-quiz/` +row.id} className='btn btn-info btn-sm ms-4 mb-2'>Edit</Link>
                                        <Link to={`/add-question/` +row.id} className='btn btn-success btn-sm ms-2 mb-2'>Add Questions</Link>
                                        <button onClick={()=>handleDeleteClick(row.id)} className='btn btn-danger btn-sm ms-2 mb-2'>Delete</button>
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

export default AllQuiz
