import React from 'react'
import TeacherSidebar from './TeacherSidebar'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { useParams } from 'react-router-dom'

const baseUrl='https://minipro.pythonanywhere.com/api'

const AddChapter = () => {
    useEffect(()=>{
        document.title='LMS | Add Chapter'
      })

      const [chapterData,setChapterData]=useState({
        title:'',
        description:'',
        video:'',
        remarks:''
      });

      const handleChange=(event)=>{
        setChapterData({
            ...chapterData,
            [event.target.name]:event.target.value
        });
      }

      const handleFileChange=(event)=>{
        setChapterData({
            ...chapterData,
            [event.target.name]:event.target.files[0]
        })
      }

      const {course_id}=useParams();

      const formSubmit=()=>{
        const _formData=new FormData();
        _formData.append('course',course_id);
        _formData.append('title',chapterData.title);
        _formData.append('description',chapterData.description);
        _formData.append('video',chapterData.video,chapterData.video.name);
        _formData.append('remarks',chapterData.remarks);

        try{
            axios.post(baseUrl+'/course-chapters/'+course_id,_formData,{
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
                <h3 className='card-header'>Add Chapter</h3>
                <div className='card-body'>
                     <div className="mb-3">
                        <label for="title" className="form-label">Title</label>
                        <input type="text" onChange={handleChange} name='title' className="form-control"/>
                    </div>
                    <div className="mb-3">
                        <label for="description" className="form-label">Description</label>
                        <textarea onChange={handleChange} name='description' className='form-control'></textarea>
                    </div>
                    <div className="mb-3">
                        <label for="video" className="form-label">Video</label>
                        <input type="file" onChange={handleFileChange} name='video' className="form-control" id="inputGroupFile02" />
                    </div>
                    <div className="mb-3">
                        <label for="techs" className="form-label">Remarks</label>
                        <textarea className='form-control' onChange={handleChange} name='remarks' placeholder='This is basic concept video.'></textarea>
                    </div>
                    <button type="button" onClick={formSubmit} className="btn btn-primary">Submit</button>
                </div>
            </div>
        </section>
    </div>
    </div>
  )
}

export default AddChapter
