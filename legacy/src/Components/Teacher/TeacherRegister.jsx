import React from 'react'
import { useEffect } from 'react'
import axios from 'axios'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'


const baseUrl='https://minipro.pythonanywhere.com/api/teacher/'

const TeacherRegister = () => {
    useEffect(()=>{
        document.title='LMS | Teacher Register';
    });

    useEffect(() => {
        window.scrollTo(0, 0)
      }, [])

    const [teacherData,setTeacherData]=useState({
            'full_name':'',
            'email':'',
            'password':'',
            'qualification':'',
            'mobile_no':'',
            'skills':'',
            'status':''
    })

    const handleChange=(event)=>{
        setTeacherData({
            ...teacherData,
            [event.target.name]:event.target.value
        });
    }

    const submitForm=()=>{
        const teacherFormData=new FormData();
        teacherFormData.append("full_name",teacherData.full_name)
        teacherFormData.append("email",teacherData.email)
        teacherFormData.append("password",teacherData.password)
        teacherFormData.append("qualification",teacherData.qualification)
        teacherFormData.append("mobile_no",teacherData.mobile_no)
        teacherFormData.append("skills",teacherData.skills)

        try{
                axios.post(baseUrl,teacherFormData)
                    .then((response)=>{
                        setTeacherData({
                            'full_name':'',
                            'email':'',
                            'password':'',
                            'qualification':'',
                            'mobile_no':'',
                            'skills':'',
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
                          window.location.href='/teacher-login';
                          window.clearTimeout(tID);
                        }, 2500);
                    
                    })
        }catch(error){
            setTeacherData({'status':'error'})
        }
    }

    const teacherLoginStatus=localStorage.getItem('teacherLoginStatus')
    if(teacherLoginStatus=='true'){
        window.location.href='/teacher-dashboard';
    }
    
 return (
    <div class="container">
    <div class="row">
      <div class="col-sm-9 col-md-7 col-lg-5 mx-auto">
        <div class="card border-0 shadow rounded-3 my-5">
          <div class="card-body p-4 p-sm-5">
          <div class="text-center wow fadeInUp">
          <h5 class="card-title text-center mb-3 fw-light fs-5 text-dark ">TEACHER SIGN UP</h5>
          </div>            
            {teacherData.status=='success' && <h3 className='text-center text-success mb-3'>Registered Successfully.</h3>}
            {teacherData.status=='error' && <h3 className='text-center text-danger mb-3'>Please fill all fields correctly.</h3>}              
              <div class="form-floating mb-3">
                <input type="text" onChange={handleChange} name='full_name' class="form-control" id="floatingInput" placeholder="fullname" />
                <label for="floatingInput">Full Name</label>
              </div>
              <div class="form-floating mb-3">
                <input type="email" onChange={handleChange} name='email' class="form-control" id="floatingInput" placeholder="name@example.com"/>
                <label for="floatingInput">Email Id</label>
              </div>
              <div class="form-floating mb-3">
                <input name='password' type="password" onChange={handleChange} class="form-control" id="floatingPassword" placeholder="Password"/>
                <label for="floatingPassword">Password</label>
              </div>
              <div class="form-floating mb-3">
                <input type="text" onChange={handleChange} name='qualification' class="form-control" id="floatingInput" placeholder="Qualificatons"/>
                <label for="floatingInput">Qualificatons</label>
              </div>
              <div class="form-floating mb-3">
                <input type="number" onChange={handleChange} name='mobile_no' class="form-control" id="floatingInput" placeholder="Mobile No"/>
                <label for="floatingInput">Mobile No</label>
              </div>
              <div class="form-floating mb-3">
                <textarea type="text" onChange={handleChange} name='skills' class="form-control" id="floatingInput" placeholder="Interest"></textarea>
                <label for="floatingInput">Skills</label>
                <div id="emailHelp" className="form-text">Eg: Python, Java, C, C++, Web Development etc...</div>
              </div>
              <div class="d-grid my-4">
                <button onClick={submitForm} class="btn btn-success rounded-pill btn-login text-uppercase fw-bold" type="submit" >SIGN UP</button>
                <hr className=''/>
                <Link to='/teacher-login' class="btn btn-danger rounded-pill btn-login text-uppercase fw-bold">SIGN IN</Link>
              </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

export default TeacherRegister
