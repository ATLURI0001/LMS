import React from 'react'
import TeacherSidebar from './TeacherSidebar'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'

const baseUrl='https://minipro.pythonanywhere.com/api'

const AddCourses = () => {
    useEffect(()=>{
        document.title='LMS | Add Course'
      })

      const [cats,setCats]=useState([])
      
      const [courseData,setCourseData]=useState({
        category:'',
        title:'',
        description:'',
        f_img:'',
        techs:''
      });

      useEffect(()=>{
        try{
            axios.get(baseUrl+'/category/')
            .then((res)=>{
                    setCats(res.data)
            });
        }catch(error){
            console.log(error)
        }
      },[]);

      const handleChange=(event)=>{
        setCourseData({
            ...courseData,
            [event.target.name]:event.target.value
        });
      }

      const handleFileChange=(event)=>{
        setCourseData({
            ...courseData,
            [event.target.name]:event.target.files[0]
        })
      }

      const formSubmit=()=>{
        const teacherId=localStorage.getItem('teacherId')
        const _formData=new FormData();
        _formData.append('category',courseData.category);
        _formData.append('teacher',teacherId);
        _formData.append('title',courseData.title);
        _formData.append('description',courseData.description);
        _formData.append('featured_img',courseData.f_img,courseData.f_img.name);
        _formData.append('techs',courseData.techs);

        try{
            axios.post(baseUrl+'/course/',_formData,{
                headers: {
                    'content-type':'multipart/form-data'
                }
            })
            .then((res)=>{
                window.location.href='/add-course';
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
                <h3 className='card-header'><i class="bi bi-plus-square"></i> Add Course</h3>
                <div className='card-body'>
                <div className="mb-3">
                        <label for="title" className="form-label">Category</label>
                        <select name='category' onChange={handleChange} className="form-control">
                            {cats.map((category,index)=>{return <option key={index} value={category.id}>{category.title}</option>})}
                        </select>
                    </div>
                    <div className="mb-3">
                        <label for="exampleInputPassword1" className="form-label">Title</label>
                        <input type="text" onChange={handleChange} name='title' className="form-control"/>
                    </div>
                    <div className="mb-3">
                        <label for="exampleInputPassword1" className="form-label">Description</label>
                        <textarea onChange={handleChange} name='description' className='form-control' id='description'></textarea>
                    </div>
                    <div className="mb-3">
                        <label for="exampleInputPassword1" className="form-label">Featured Image</label>
                        <input type="file" onChange={handleFileChange} name='f_img' className="form-control"/>
                    </div>
                    <div className="mb-3">
                        <label for="exampleInputPassword1" className="form-label">Technologies</label>
                        <textarea onChange={handleChange} name='techs' className='form-control' placeholder='php,Java,C++...'></textarea>
                    </div>
                    <button type="submit" onClick={formSubmit} className="btn btn-primary">Submit</button>
                </div>
            </div>
        </section>
    </div>
  </div>
  )
}

export default  AddCourses
