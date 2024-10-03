import Sidebar from './Sidebar'
import React from 'react'
import { useEffect } from 'react'
import axios from 'axios'
import { useState } from 'react'
import Swal from 'sweetalert2'

const baseUrl='https://minipro.pythonanywhere.com/api'

const ChangePassword = () => {
    useEffect(()=>{
        document.title='LMS | User Password Settings'
      })

      
    const studentId=localStorage.getItem('studentId');

    const [studentData,setstudentData]=useState({
        'password':''
    });

    const handleChange=(event)=>{
        setstudentData({
            ...studentData,
            [event.target.name]:event.target.value
        });
    }

    const submitForm=()=>{
        const studentFormData=new FormData();
        studentFormData.append("password",studentData.password)

        try{
                axios.post(baseUrl+'/student/change-password/'+studentId+'/',studentFormData)
                .then((response)=>{
                    if(response.status==200){
                        Swal.fire({
                            title:'Password Updated Successfully',
                            icon:'success',
                            toast:true,
                            timer:3000,
                            position:'top-right',
                            timerProgressBar: true,
                            showConfirmButton: false
                        
                        });
                        window.location.href='/user-logout';
                    }else{
                        Swal.fire({
                            title:'Error: Please Try again!',
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
            setstudentData({'status':'error'})
        }
    }

    const studentLoginStatus=localStorage.getItem('studentLoginStatus')
    if(studentLoginStatus!='true'){
        window.location.href='/user-login';
    }

  return (
    <div className='container mt-4'>
        <div className='row'>
            <aside className='col-md-3'>
                <Sidebar />
            </aside>
            <section className='col-md-9'>
                <div className='card'>
                    <h5 className='card-header'>
                    <i class="bi bi-person-bounding-box"/> Change Password
                    </h5>
                    <div className='card-body'>
                        <div className="mb-3 row">
                        <label for="inputPassword" className="col-sm-2 col-form-label">New Password</label>
                        <div className="col-sm-10">
                        <input type="text" name='password' value={studentData.password} onChange={handleChange} className="form-control" id="inputPassword" />
                        </div>    
                    </div>
                    <hr/>
                        <button onClick={submitForm} className='btn btn-primary'>Update</button>
                    </div>
                </div>
            </section>
        </div>
    </div>
  )
}

export default ChangePassword 

