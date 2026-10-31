import React from 'react'
import TeacherSidebar from './TeacherSidebar'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'

const baseUrl='https://minipro.pythonanywhere.com/api'

const AddQuiz = () => {
    useEffect(()=>{
        document.title='LMS | Add Quiz'
      })
      
      const [quizData,setQuizData]=useState({
        title:'',
        detail:'',
      });
      
      const handleChange=(event)=>{
        setQuizData({
            ...quizData,
            [event.target.name]:event.target.value
        });
      }

      const formSubmit=()=>{
        const teacherId=localStorage.getItem('teacherId')
        const _formData=new FormData();
        _formData.append('teacher',teacherId);
        _formData.append('title',quizData.title);
        _formData.append('detail',quizData.detail);

        try{
            axios.post(baseUrl+'/quiz/',_formData,{
                headers: {
                    'content-type':'multipart/form-data'
                }
            })
            .then((res)=>{
                window.location.href='/add-quiz';
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
                <h3 className='card-header'>Add Quiz</h3>
                <div className='card-body'>
                    <div className="mb-3">
                        <label for="exampleInputPassword1" className="form-label">Title</label>
                        <input type="text" onChange={handleChange} name='title' className="form-control"/>
                    </div>
                    <div className="mb-3">
                        <label for="exampleInputPassword1" className="form-label">Detail</label>
                        <textarea onChange={handleChange} name='detail' className='form-control' ></textarea>
                    </div>
                    <button type="submit" onClick={formSubmit} className="btn btn-primary">Submit</button>
                </div>
            </div>
        </div>
    </div>

  </div>
  )
}

export default  AddQuiz
