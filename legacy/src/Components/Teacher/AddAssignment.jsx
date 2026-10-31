import TeacherSidebar from './TeacherSidebar'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { useParams } from 'react-router-dom'

const baseUrl='https://minipro.pythonanywhere.com/api'

const AddAssignment = () => {
    useEffect(()=>{
        document.title='LMS | Add Assignment'
      })

      useEffect(() => {
        window.scrollTo(0, 0)
      }, [])

      const [assignmentData,setAssignmentData]=useState({
        title:'',
        detail:''
      });

      const handleChange=(event)=>{
        setAssignmentData({
            ...assignmentData,
            [event.target.name]:event.target.value
        });
      }

      const {student_id}=useParams();
      const {teacher_id}=useParams();

      const formSubmit=()=>{
        const _formData=new FormData();
        _formData.append('teacher',teacher_id);
        _formData.append('title',assignmentData.title);
        _formData.append('detail',assignmentData.detail);
        _formData.append('student',student_id);

        try{
            axios.post(baseUrl+'/student-assignment/'+teacher_id+'/'+student_id,_formData,{
                headers: {
                    'content-type':'multipart/form-data'
                }
            })
            .then((res)=>{
                if(res.status==200 || res.status==201){
                    Swal.fire({
                        title:'Assignment added Successfully!',
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
        <section className='col-md-9'>
            <div className='card'>
                <h3 className='card-header'>Add Assignment</h3>
                <div className='card-body'>
                     <div className="mb-3">
                        <label for="title" className="form-label">Title</label>
                        <input type="text" onChange={handleChange} name='title' className="form-control"/>
                    </div>
                    <div className="mb-3">
                        <label for="description" className="form-label">Description</label>
                        <textarea onChange={handleChange} name='detail' className='form-control'></textarea>
                    </div>
                    <button type="button" onClick={formSubmit} className="btn btn-primary">Submit</button>
                </div>
            </div>
        </section>
    </div>
    </div>
  )
}

export default AddAssignment
