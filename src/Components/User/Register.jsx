import React from 'react'
import { useEffect } from 'react'
import axios from 'axios'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'

const baseUrl='https://minipro.pythonanywhere.com/api/student/'

const Register = () => {
    useEffect(()=>{
        document.title='LMS | Student Register'
      })

      useEffect(() => {
        window.scrollTo(0, 0)
      }, [])

    const [studentData,setStudentData]=useState({
        'fullname':'',
        'email':'',
        'password':'',
        'username':'',
        'interseted_categories':'',
        'status':''
    });

    const handleChange=(event)=>{
        setStudentData({
            ...studentData,
            [event.target.name]:event.target.value
        });
    }

    const submitForm=()=>{
        const studentFormData=new FormData();
        studentFormData.append("fullname",studentData.fullname)
        studentFormData.append("email",studentData.email)
        studentFormData.append("password",studentData.password)
        studentFormData.append("username",studentData.username)
        studentFormData.append("interseted_categories",studentData.interseted_categories)

        try{
                axios.post(baseUrl,studentFormData)
                    .then((response)=>{
                        setStudentData({
                            'fullname':'',
                            'email':'',
                            'password':'',
                            'username':'',
                            'interseted_categories':'',
                            'status':'success'
                        });
                        if(response.status==200 || response.status==201){
                          Swal.fire({
                              title:'Register Successfully!',
                              icon:'success',
                              toast:true,
                              timer:2000,
                              position:'top-right',
                              timerProgressBar: true,
                              showConfirmButton: false
                          });
                      }
                        let tID = setTimeout(function () {
                          window.location.href='/user-login';
                          window.clearTimeout(tID);
                        }, 2500);
                    })
        }catch(error){
            console.log(error);
            setStudentData({'status':'error'})
        }
    }

  return (
    <>
    <div class="container">
    <div class="row">
      <div class="col-sm-9 col-md-7 col-lg-5 mx-auto">
        <div class="card border-0 shadow rounded-3 my-5">
          <div class="card-body p-4 p-sm-5">
          <div class="text-center wow fadeInUp">
          <h5 class="card-title text-center mb-3 fw-light fs-5 text-dark ">STUDENT SIGN UP</h5>
          </div>            
            {studentData.status=='success' && <h3 className='text-center text-success mb-3'>Registered Successfully</h3>}
            {studentData.status=='error' && <h3 className='text-center text-danger mb-3'>Something wrong is happened</h3>}              
              <div class="form-floating mb-3">
                <input type="text" onChange={handleChange} name='fullname' class="form-control" id="floatingInput" placeholder="fullname" />
                <label for="floatingInput">Full Name</label>
              </div>
              <div class="form-floating mb-3">
                <input type="email" onChange={handleChange} name='email' class="form-control" id="floatingInput" placeholder="name@example.com"/>
                <label for="floatingInput">Email Id</label>
              </div>
              <div class="form-floating mb-3">
                <input type="text" onChange={handleChange} name='username' class="form-control" id="floatingInput" placeholder="username"/>
                <label for="floatingInput">User Name</label>
              </div>
              <div class="form-floating mb-3">
                <input name='password' type="password" onChange={handleChange} class="form-control" id="floatingPassword" placeholder="Password"/>
                <label for="floatingPassword">Password</label>
              </div>
              <div class="form-floating mb-3">
                <textarea type="text" onChange={handleChange} name='interseted_categories' class="form-control" id="floatingInput" placeholder="Interest"></textarea>
                <label for="floatingInput">Interest</label>
                <div id="emailHelp" className="form-text">Eg: Python, Java, C, C++, Web Development etc...</div>
              </div>
              <div class="d-grid my-4">
                <button onClick={submitForm} class="btn btn-success rounded-pill btn-login text-uppercase fw-bold" type="submit" >SIGN UP</button>
                <hr className=''/>
                <Link to='/user-login' class="btn btn-danger rounded-pill btn-login text-uppercase fw-bold">SIGN IN</Link>
              </div>
          </div>
        </div>
      </div>
    </div>
    </div>
    </>
  )
}

export default Register
