import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'

const baseUrl='https://minipro.pythonanywhere.com/api'

const Login = () => {

    const studentLoginStatus=localStorage.getItem('studentLoginStatus');

    useEffect(() => {
      window.scrollTo(0, 0)
    }, [])
    
    const [studentLoginData,setStudentLoginData]=useState({
        email:'',
        password:''
      });

      const [errorMsg, setErrorMsg]=useState('')

      const handleChange=(event)=>{
        setStudentLoginData({
            ...studentLoginData,
            [event.target.name]:event.target.value
        });
    }

    const submitForm=()=>{
        const studentFormData=new FormData;
        studentFormData.append('email',studentLoginData.email)
        studentFormData.append('password',studentLoginData.password)
        try{
            axios.post(baseUrl+'/student-login',studentFormData)
            .then((res)=>{
                if(res.data.bool==true){
                    localStorage.setItem('studentLoginStatus',true);
                    localStorage.setItem('studentId',res.data.student_id);
                    window.location.href='/user-dashboard';
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

    if(studentLoginStatus=='true'){
        window.location.href='/user-dashboard';
    }

    useEffect(()=>{
        document.title='LMS | Login'
      })

  return (
  <>
    <div class="container">
    <div class="row">
      <div class="col-sm-9 col-md-7 col-lg-5 mx-auto">
        <div class="card border-0 shadow rounded-3 my-5">
          <div class="card-body p-4 p-sm-5">
          <div class="text-center wow fadeInUp">
          <h5 class="card-title text-center mb-3 fw-light fs-5 text-dark">STUDENT SIGN IN</h5>
          </div>            
            {errorMsg && <p className='text-danger'>{errorMsg}</p>}
              <div class="form-floating mb-3">
                <input type="email" value={studentLoginData.email} onChange={handleChange} name='email' class="form-control" id="floatingInput" placeholder="name@example.com"/>
                <label for="floatingInput">Email address</label>
              </div>
              <div class="form-floating mb-3">
                <input value={studentLoginData.password} name='password' type="password" onChange={handleChange} class="form-control" id="floatingPassword" placeholder="Password"/>
                <label for="floatingPassword">Password</label>
              </div>
              <div class="d-grid my-4">
                <button onClick={submitForm} class="btn btn-success rounded-pill btn-login text-uppercase fw-bold" type="submit" >Sign in</button>
                <hr className=''/>
                <Link to='/user-register' class="btn btn-danger rounded-pill btn-login text-uppercase fw-bold" type="submit" >SIGN UP</Link>
              </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </>
  )
}

export default Login
