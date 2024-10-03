import React from 'react'
import TeacherSidebar from './TeacherSidebar'
import { useEffect } from 'react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import axios from 'axios'

const baseUrl='https://minipro.pythonanywhere.com/api'

const EditChapter = () => {

    useEffect(()=>{
        document.title='LMS | Edit Chapter'
      })

      const [chapterData,setChapterData]=useState({
        title:'',
        description:'',
        prev_video:'',
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
      const {chapter_id}=useParams();
      
      const formSubmit=()=>{
        const _formData=new FormData();
        _formData.append('title',chapterData.title);
        _formData.append('description',chapterData.description);
        if(chapterData.video!==''){
            _formData.append('video',chapterData.video,chapterData.video.name);
        }
        _formData.append('remarks',chapterData.remarks);

        try{
            axios.put(baseUrl+'/chapter/'+chapter_id,_formData,{
                headers: {
                    'content-type':'multipart/form-data'
                }
            })
            .then((res)=>{
                if(res.status==200){
                    Swal.fire({
                        title:'Edited and Uploaded Successfully!',
                        icon:'success',
                        toast:true,
                        timer:3000,
                        position:'top-right',
                        timerProgressBar: true,
                        showConfirmButton: false
                    })
                }
            });
        }catch(error){
            console.log(error);
        }
      };

      useEffect(()=>{
        try{
            axios.get(baseUrl+'/chapter/'+chapter_id)
            .then((res)=>{
              setChapterData({
                title:res.data.title,
                description:res.data.description,
                prev_video:res.data.video,
                remarks:res.data.remarks,
                video:''
              });
            });
        }catch(error){
            console.log(error);
        }
      },[]);

  return (
    <div className='container mt-4'>
    <div className='row'>
        <aside className='col-md-3'>
            <TeacherSidebar />
        </aside>
        <section className='col-md-9'>
            <div className='card'>
                <h3 className='card-header'>Edit Chapter</h3>
                <div className='card-body'>
                <form>
                    <div className="mb-3">
                        <label for="title" className="form-label">Title</label>
                        <input type="text" value={chapterData.title} onChange={handleChange} name='title' className="form-control"/>
                    </div>
                    <div className="mb-3">
                        <label for="description" className="form-label">Description</label>
                        <textarea value={chapterData.description} onChange={handleChange} name='description' className='form-control'></textarea>
                    </div>
                    <div className="mb-3">
                        <label for="video" className="form-label">Video</label>
                        <input type="file" onChange={handleFileChange} name='video' className="form-control" id="inputGroupFile02" />
                        {chapterData.prev_video && 
                            <video controls width='100%' className='mt-2' >
                                <source src={chapterData.prev_video} type='video/mp4' />
                            </video>
                        }
                    </div>
                    <div className="mb-3">
                        <label for="techs" className="form-label">Remarks</label>
                        <textarea value={chapterData.remarks} className='form-control' onChange={handleChange} name='remarks' placeholder='This is basic concept video.'></textarea>
                    </div>
                    <button type="button" onClick={formSubmit} className="btn btn-primary">Submit</button>
                    </form>
                </div>
            </div>
        </section>
    </div>
</div>
  )
}

export default EditChapter
