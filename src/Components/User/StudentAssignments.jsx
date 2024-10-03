import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import Sidebar from './Sidebar'
import Swal from 'sweetalert2'

const baseUrl='https://minipro.pythonanywhere.com/api'

const StudentAssignments = () => {

    const studentId=localStorage.getItem('studentId')
    const [assignmentData, setAssignmentData]=useState([]);
    const [assignmentStatus, setAssignmentStatus]=useState('');

    useEffect(()=>{
        document.title='LMS | My Assignments'
      })

      useEffect(()=>{
        try{
            axios.get(baseUrl+'/my-assignments/'+studentId)
            .then((res)=>{
                setAssignmentData(res.data)
            });
        }catch(error){
            console.log(error)
        }
      },[]);

      const markAsDone = (assignment_id,title,detail,student,teacher) =>{
        const _formData=new FormData();
        _formData.append('student_status',true);
        _formData.append('title',title);
        _formData.append('detail',detail);
        _formData.append('student',student);
        _formData.append('teacher',teacher);

        try{
            axios.put(baseUrl+'/update-assignments/'+assignment_id,_formData,{
                headers: {
                    'content-type':'multipart/form-data'
                }
            })
            .then((res)=>{
              if(res.status==200 || res.status==201){
                Swal.fire({
                    title:'You Successfully Completed the Assignment!',
                    icon:'success',
                    toast:true,
                    timer:3000,
                    position:'top-right',
                    timerProgressBar: true,
                    showConfirmButton: false
                });
                setAssignmentStatus('success')
            }
            });
        }catch(error){
            console.log(error);
        }
    }

  return (
    <div className='container mt-4'>
        <div className='row'>
            <aside className='col-md-3'>
                <Sidebar />
            </aside>
            <section className='col-md-9'>
                <div className='card'>
                    <h5 className='card-header'><i class="bi bi-journal-minus"></i> My Assignment</h5>
                    <div className='card-body table-responsive'>
                        <table className='table table-striped table-hover'>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Details</th>
                                    <th>Created By</th>
                                    <th>Action </th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignmentData.map((row,index) => 
                                <tr>
                                    <td>{row.title}</td>
                                    <td>{row.detail}</td>
                                    <td><Link to={`/teacher-detail/`+row.teacher.id}>{row.teacher.full_name}</Link></td>
                                    <td>
                                        {row.student_status==false &&
                                            <button onClick={()=>markAsDone(row.id,row.title,row.detail,row.student.id,row.teacher.id)} className="btn btn-success btn-sm">Mark as Done</button>
                                        }
                                        {row.student_status==true &&
                                            <span className='badge bg-success rounded-pill'>Completed</span>
                                        }
                                    </td>
                                </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    </div>
  )
}

export default StudentAssignments
