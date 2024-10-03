import React from 'react'
import TeacherSidebar from './TeacherSidebar'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import Swal from 'sweetalert2'

const baseUrl='https://minipro.pythonanywhere.com/api'

const EditCourse = () => {
    useEffect(()=>{
        document.title='LMS | Edit Course'
      })

      const [cats,setCats]=useState([])
      const [courseData,setCourseData]=useState({
        category:'',
        title:'',
        description:'',
        prev_img:'',
        f_img:'',
        techs:''
      });

      const {course_id}=useParams();

      useEffect(()=>{
        try{
            axios.get(baseUrl+'/category')
            .then((res)=>{
                    setCats(res.data)
            });
        }catch(error){
            console.log(error)
        }

        try{
            axios.get(baseUrl+'/teacher-course-detail/'+course_id)
            .then((res)=>{
                setCourseData({
                category:res.data.category,
                title:res.data.title,
                description:res.data.description,
                prev_img:res.data.featured_img,
                f_img:'',
                techs:res.data.techs,
              });
            });
        }catch(error){
            console.log(error);
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

      const teacherId=localStorage.getItem('teacherId')

      const formSubmit=()=>{
        const _formData=new FormData();
        _formData.append('category',courseData.category);
        _formData.append('teacher',teacherId);
        _formData.append('title',courseData.title);
        _formData.append('description',courseData.description);
        if(courseData.f_img!==''){
            _formData.append('featured_img',courseData.f_img,courseData.f_img.name);
        }
        _formData.append('techs',courseData.techs);

        try{
            axios.put(baseUrl+'/teacher-course-detail/'+course_id,_formData,{
                headers: {
                    'content-type':'multipart/form-data'
                }
            })
            .then((res)=>{
                if(res.status==200){
                    Swal.fire({
                        title:'Data Updated',
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
                <h3 className='card-header'>Edit Course</h3>
                <div className='card-body'>
                <div className="mb-3">
                        <label for="title" className="form-label">Category</label>
                        <select defaultValue={courseData.category} name='category' onChange={handleChange} className="form-control">
                            {cats.map((category,index)=>{return <option key={index} value={category.id}>{category.title}</option>})}
                        </select>
                    </div>
                    <div className="mb-3">
                        <label for="exampleInputPassword1" className="form-label">Title</label>
                        <input defaultValue={courseData.title} type="text" onChange={handleChange} name='title' className="form-control"/>
                    </div>
                    <div className="mb-3">
                        <label for="exampleInputPassword1" className="form-label">Description</label>
                        <textarea defaultValue={courseData.description} onChange={handleChange} name='description' className='form-control' id='description'></textarea>
                    </div>
                    <div className="mb-3">
                        <label for="exampleInputPassword1" className="form-label">Featured Image</label>
                        <input defaultValue={courseData.featured_img} type="file" onChange={handleFileChange} name='f_img' className="form-control"/>
                        {courseData.prev_img && 
                            <p className='mt-2'><img src={courseData.prev_img}  width='300' alt={courseData.title}/></p>
                        }
                    </div>
                    <div className="mb-3">
                        <label for="exampleInputPassword1" className="form-label">Technologies</label>
                        <textarea defaultValue={courseData.techs} onChange={handleChange} name='techs' className='form-control' placeholder='php,Java,C++...'></textarea>
                    </div>
                    <button type="submit" onClick={formSubmit} className="btn btn-primary">Submit</button>
                </div>
            </div>
        </section>
    </div>

  </div>
  )
}

export default EditCourse
