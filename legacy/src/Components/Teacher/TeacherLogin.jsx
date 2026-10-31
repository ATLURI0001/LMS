import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import firebase from '../firebase'
import Swal from 'sweetalert2'

const baseUrl='https://minipro.pythonanywhere.com/api'

const TeacherLogin = () => {

    const teacherLoginStatus=localStorage.getItem('teacherLoginStatus');

      const [teacherLoginData,setTeacherLoginData]=useState({
        email:'',
        password:''
      });

      useEffect(() => {
        window.scrollTo(0, 0)
      }, [])
      
      const [errorMsg, setErrorMsg]=useState('')

      const handleChange=(event)=>{
        setTeacherLoginData({
            ...teacherLoginData,
            [event.target.name]:event.target.value
        });
    }

    const submitForm=()=>{
        const teacherFormData=new FormData;
        teacherFormData.append('email',teacherLoginData.email)
        teacherFormData.append('password',teacherLoginData.password)
        try{
            axios.post(baseUrl+'/teacher-login',teacherFormData)
            .then((res)=>{
                if(res.data.bool==true){
                    localStorage.setItem('teacherLoginStatus',true);
                    localStorage.setItem('teacherId',res.data.teacher_id);
                    window.location.href='/teacher-dashboard';
                }else{
                  if(res.status==200 || res.status==201){
                    Swal.fire({
                        title:'Please Enter all details correctly!',
                        icon:'error',
                        toast:true,
                        timer:2000,
                        position:'top',
                        timerProgressBar: true,
                        showConfirmButton: false
                    });
                }
                }
            })
        }catch(error){
            console.log(error)
        }
    }

    if(teacherLoginStatus=='true'){
        window.location.href='/teacher-dashboard';
    }

    useEffect(()=>{
        document.title='LMS | Teacher Login'
      })


  return (
    <>
  <div class="container">
    <div class="row">
      <div class="col-sm-9 col-md-7 col-lg-5 mx-auto">
        <div class="card border-0 shadow rounded-3 my-5">
          <div class="card-body p-4 p-sm-5">
          <div class="text-center wow fadeInUp">
          <h5 class="card-title text-center mb-3 fw-light fs-5 text-dark">TEACHER SIGN IN</h5>
          </div>            
            {errorMsg && <p className='text-danger'>{errorMsg}</p>}
              <div class="form-floating mb-3">
                <input type="email" value={teacherLoginData.email} onChange={handleChange} name='email' class="form-control" id="floatingInput" placeholder="name@example.com"/>
                <label for="floatingInput">Email address</label>
              </div>
              <div class="form-floating mb-3">
                <input value={teacherLoginData.password} name='password' type="password" onChange={handleChange} class="form-control" id="floatingPassword" placeholder="Password"/>
                <label for="floatingPassword">Password</label>
              </div>
              <div class="d-grid my-4">
                <button onClick={submitForm} class="btn btn-success rounded-pill btn-login text-uppercase fw-bold" type="submit" >Sign in</button>
                <hr className=''/>
                <Link to='/teacher-register' type="submit"  class="btn btn-danger rounded-pill btn-login text-uppercase fw-bold " >SIGN UP</Link>
              </div>
          </div>
        </div>
      </div>
    </div>
    </div>
    </>
  )
}

export default TeacherLogin
