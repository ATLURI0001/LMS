import React from 'react'
import TeacherSidebar from './TeacherSidebar'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import Swal from 'sweetalert2'

const baseUrl='https://minipro.pythonanywhere.com/api'

const EditQuiz = () => {
    useEffect(()=>{
        document.title='LMS | Edit Quiz'
      })

      const teacherId=localStorage.getItem('teacherId');

      const [quizData,setQuizData]=useState({
        title:'',
        detail:''
      });

      const {quiz_id}=useParams();

      useEffect(()=>{
        try{
            axios.get(baseUrl+'/teacher-quiz-detail/'+quiz_id)
            .then((res)=>{
                setQuizData(res.data)
            });
        }catch(error){
            console.log(error)
        }
      },[]);

      const handleChange=(event)=>{
        setQuizData({
            ...quizData,
            [event.target.name]:event.target.value
        });
      }
       
      const formSubmit=()=>{
        const _formData=new FormData();
        _formData.append('teacher',teacherId);
        _formData.append('title',quizData.title);
        _formData.append('detail',quizData.detail);

        try{
            axios.put(baseUrl+'/teacher-quiz-detail/'+quiz_id,_formData,{
                headers: {
                    'content-type':'multipart/form-data'
                }
            })
            .then((res)=>{
                if(res.status==200){
                    Swal.fire({
                        title:'Data Edited',
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
      };

  return (
    <div className='container mt-4'>
    <div className='row'>
        <aside className='col-md-3'>
            <TeacherSidebar />
        </aside>
        <div className='col-9'>
            <div className='card'>
                <h3 className='card-header'>Edit Quiz</h3>
                <div className='card-body'>
                    <div className="mb-3">
                        <label for="exampleInputPassword1" className="form-label">Title</label>
                        <input defaultValue={quizData.title} type="text" onChange={handleChange} name='title' className="form-control"/>
                    </div>
                    <div className="mb-3">
                        <label for="exampleInputPassword1" className="form-label">Detail</label>
                        <textarea defaultValue={quizData.detail} onChange={handleChange} name='detail' className='form-control'></textarea>
                    </div>
                    <button type="submit" onClick={formSubmit} className="btn btn-primary">Submit</button>
                </div>
            </div>
        </div>
    </div>

  </div>
  )
}

export default EditQuiz
