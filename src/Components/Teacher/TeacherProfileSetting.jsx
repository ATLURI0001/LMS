import TeacherSidebar from './TeacherSidebar'
import React from 'react'
import { useEffect } from 'react'
import axios from 'axios'
import { useState } from 'react'
import Swal from 'sweetalert2'

const baseUrl='https://minipro.pythonanywhere.com/api'

const TeacherProfileSetting = () => {
    useEffect(()=>{
        document.title='LMS | Settings'
      })

    const teacherId=localStorage.getItem('teacherId');

    const [teacherData,setTeacherData]=useState({
        'full_name':'',
        'email':'',
        'qualification':'',
        'mobile_no':'',
        'skills':'',
        'profile_img':'',
        'p_img':'',
        'status':'',
        'face_url':'',
        'insta_url':'',
        'twit_url':'',
        'web_url':'',
        'you_url':'',
    });

    useEffect(()=>{
        try{
            axios.get(baseUrl+'/teacher/'+teacherId)
            .then((res)=>{
                setTeacherData({
                full_name:res.data.full_name,
                email:res.data.email,
                qualification:res.data.qualification,
                mobile_no:res.data.mobile_no,
                skills:res.data.skills,
                profile_img:res.data.profile_img,
                p_img:'',
                face_url:res.data.face_url,
                insta_url:res.data.insta_url,
                twit_url:res.data.twit_url,
                web_url:res.data.web_url,
                you_url:res.data.you_url,

              });
            });
        }catch(error){
            console.log(error);
        }
      },[]);

    const handleChange=(event)=>{
        setTeacherData({
            ...teacherData,
            [event.target.name]:event.target.value
        });
    }

    const handleFileChange=(event)=>{
        setTeacherData({
            ...teacherData,
            [event.target.name]:event.target.files[0]
        })
      }

    const submitForm=()=>{
        const teacherFormData=new FormData();
        teacherFormData.append("full_name",teacherData.full_name)
        teacherFormData.append("email",teacherData.email)
        teacherFormData.append("qualification",teacherData.qualification)
        teacherFormData.append("mobile_no",teacherData.mobile_no)
        teacherFormData.append("skills",teacherData.skills)
        teacherFormData.append("face_url",teacherData.face_url)
        teacherFormData.append("insta_url",teacherData.insta_url)
        teacherFormData.append("twit_url",teacherData.twit_url)
        teacherFormData.append("web_url",teacherData.web_url)
        teacherFormData.append("you_url",teacherData.you_url)
        teacherFormData.append("skills",teacherData.skills)

        if(teacherData.p_img!==''){
            teacherFormData.append('profile_img',teacherData.p_img,teacherData.p_img.name);
        }

        try{
                axios.put(baseUrl+'/teacher/'+teacherId+'/',teacherFormData,{
                    headers: {
                        'content-type':'multipart/form-data'
                    }
                }).then((response)=>{
                    if(response.status==200){
                        Swal.fire({
                            title:'Profile Updated Successfully',
                            icon:'success',
                            toast:true,
                            timer:3000,
                            position:'top-right',
                            timerProgressBar: true,
                            showConfirmButton: false
                        });
                    }
                    })
        }catch(error){
            console.log(error);
            setTeacherData({'status':'error'})
        }
    }

    const teacherLoginStatus=localStorage.getItem('teacherLoginStatus')
    if(teacherLoginStatus!='true'){
        window.location.href='/teacher-login';
    }

  return (
    <div className='container mt-4'>
        <div className='row'>
            <aside className='col-md-3'>
                <TeacherSidebar />
            </aside>
            <section className='col-md-9'>
                <div className='card'>
                    <h5 className='card-header'>
                    <i class="bi bi-person-lines-fill"></i> Profile Settings
                    </h5>
                    <div className='card-body'>
                    <div className="mb-3 row">
                        <label for="staticEmail" className="col-sm-2 col-form-label">Full Name</label>
                        <div className="col-sm-10">
                        <input  name='full_name' type="text"  value={teacherData.full_name} onChange={handleChange} className="form-control" />
                        </div>
                    </div>
                    <div className="mb-3 row">
                        <label for="staticEmail" className="col-sm-2 col-form-label">Email</label>
                        <div className="col-sm-10">
                        <input name='email' type="text" value={teacherData.email} onChange={handleChange} className="form-control"/>
                        </div>
                    </div>
                    <div className="mb-3 row">
                        <label className="col-sm-2 col-form-label">Profile Image</label>
                        <div className="col-sm-10">
                        <input defaultValue={teacherData.featured_img} type="file" onChange={handleFileChange} name='p_img' className="form-control"/>
                        {teacherData.profile_img && 
                            <p className='mt-2'><img src={teacherData.profile_img} width={300} alt={teacherData.full_name} /></p>
                        }
                        </div>
                    </div>
                    <div className="mb-3 row">
                        <label for="staticEmail" className="col-sm-2 col-form-label">Mobile no</label>
                        <div className="col-sm-10">
                        <input name='mobile_no' type="number" value={teacherData.mobile_no} onChange={handleChange} className="form-control"/>
                        </div>
                    </div>
                    <div className="mb-3 row">
                        <label for="staticEmail" className="col-sm-2 col-form-label">Skills</label>
                        <div className="col-sm-10">
                        <textarea name='skills' type="text"  value={teacherData.skills} onChange={handleChange} className="form-control" id="staticEmail" />
                        </div>
                    </div>
                    <div className="mb-3 row">
                        <label for="staticEmail" className="col-sm-2 col-form-label">Qualification</label>
                        <div className="col-sm-10">
                        <textarea name='qualification' type="text"  value={teacherData.qualification} onChange={handleChange} className="form-control" id="staticEmail" />
                        </div>
                    </div>
                    <hr />
                    <h4 className='my-4'>Social Accounts</h4>
                    <div className="mb-3 row">
                        <label for="staticEmail" className="col-sm-2 col-form-label">Facebook Link</label>
                        <div className="col-sm-10">
                        <input  name='face_url' type="text"  value={teacherData.face_url} onChange={handleChange} className="form-control" />
                        </div>
                    </div><div className="mb-3 row">
                        <label for="staticEmail" className="col-sm-2 col-form-label">Instagram Link</label>
                        <div className="col-sm-10">
                        <input  name='insta_url' type="text"  value={teacherData.insta_url} onChange={handleChange} className="form-control" />
                        </div>
                    </div><div className="mb-3 row">
                        <label for="staticEmail" className="col-sm-2 col-form-label">Twitter Link</label>
                        <div className="col-sm-10">
                        <input  name='twit_url' type="text"  value={teacherData.twit_url} onChange={handleChange} className="form-control" />
                        </div>
                    </div><div className="mb-3 row">
                        <label for="staticEmail" className="col-sm-2 col-form-label">Website Link</label>
                        <div className="col-sm-10">
                        <input  name='web_url' type="text"  value={teacherData.web_url} onChange={handleChange} className="form-control" />
                        </div>
                    </div><div className="mb-3 row">
                        <label for="staticEmail" className="col-sm-2 col-form-label">Youtube Link</label>
                        <div className="col-sm-10">
                        <input  name='you_url' type="text"  value={teacherData.you_url} onChange={handleChange} className="form-control" />
                        </div>
                    </div>
                        <button onClick={submitForm} className='btn btn-primary'>Update</button>
                    </div>
                </div>
            </section>
        </div>
    </div>
  )
}

export default TeacherProfileSetting
