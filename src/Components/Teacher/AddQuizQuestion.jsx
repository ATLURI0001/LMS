import React from 'react'
import TeacherSidebar from './TeacherSidebar'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { useParams } from 'react-router-dom'

const baseUrl='https://minipro.pythonanywhere.com/api'

const AddQuizQuestion = () => {
    useEffect(()=>{
        document.title='LMS | Add Quiz Questions'
      })

      const [questionData,setquestionData]=useState({
        quiz:'',
        questions:'',
        ans1:'',
        ans2:'',
        ans3:'',
        ans4:'',
        right_ans:'',
      });

      const handleChange=(event)=>{
        setquestionData({
            ...questionData,
            [event.target.name]:event.target.value
        });
      }

      const {quiz_id}=useParams();

      const formSubmit=()=>{
        const _formData=new FormData();
        _formData.append('quiz',quiz_id);
        _formData.append('questions',questionData.questions);
        _formData.append('ans1',questionData.ans1);
        _formData.append('ans2',questionData.ans2);
        _formData.append('ans3',questionData.ans3);
        _formData.append('ans4',questionData.ans4);
        _formData.append('right_ans',questionData.right_ans);


        try{
            axios.post(baseUrl+'/quiz-questions/'+quiz_id,_formData,{
                headers: {
                    'content-type':'multipart/form-data'
                }
            })
            .then((res)=>{
                if(res.status==200 || res.status==201){
                    Swal.fire({
                        title:'Uploaded Successfully!',
                        icon:'success',
                        toast:true,
                        timer:3000,
                        position:'top-right',
                        timerProgressBar: true,
                        showConfirmButton: false
                    });
                    window.location.reload();
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
                <h3 className='card-header'>Add Question</h3>
                <div className='card-body'>
                     <div className="mb-3">
                        <label for="title" className="form-label">Question</label>
                        <input type="text" onChange={handleChange} name='questions' className="form-control"/>
                    </div>
                    <div className="mb-3">
                        <label for="title" className="form-label">Ans 1</label>
                        <input type="text" onChange={handleChange} name='ans1' className="form-control"/>
                    </div>
                    <div className="mb-3">
                        <label for="title" className="form-label">Ans 2</label>
                        <input type="text" onChange={handleChange} name='ans2' className="form-control"/>
                    </div>
                    <div className="mb-3">
                        <label for="title" className="form-label">Ans 3</label>
                        <input type="text" onChange={handleChange} name='ans3' className="form-control"/>
                    </div>
                    <div className="mb-3">
                        <label for="title" className="form-label">Ans4</label>
                        <input type="text" onChange={handleChange} name='ans4' className="form-control"/>
                    </div>
                    <div className="mb-3">
                        <label for="title" className="form-label">Right Answer</label>
                        <input type="text" onChange={handleChange} name='right_ans' className="form-control"/>
                    </div>
                    <button type="button" onClick={formSubmit} className="btn btn-primary">Submit</button>
                </div>
            </div>
        </div>
    </div>
    </div>
  )
}

export default AddQuizQuestion

