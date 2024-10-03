import React from 'react'
import TeacherSidebar from './TeacherSidebar'
import { useEffect } from 'react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import axios from 'axios'

const baseUrl='https://minipro.pythonanywhere.com/api'

const ShowAssignment = () => {

    useEffect(() => {
        window.scrollTo(0, 0)
      }, [])
      
    useEffect(()=>{
        document.title='LMS | Assignment Details'
      })

    const [assignmentData, setAssignmentData]=useState([]);

    const [totalResult, settotalResult]=useState(0);    

    const {teacher_id}=useParams();
    const {student_id}=useParams();

    useEffect(()=>{
      try{
          axios.get(baseUrl+'/student-assignment/'+teacher_id+'/'+student_id)
          .then((res)=>{
            settotalResult(res.data.length)
            setAssignmentData(res.data)
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
                <h5 className='card-header'> All Assignments ({totalResult}) <Link className='btn btn-success btn-sm float-end ' to={`/add-assignment/${student_id}/${teacher_id}`}>Add Assignment</Link></h5>
                <div className='card-body table-responsive'>
                    <table className='table table-bordered'>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Student Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignmentData.map((row,index) => 
                                <tr>
                                    <td>{row.title}</td>
                                    <td>
                                        {row.student_status==false &&
                                            <span className='badge rounded-pill bg-warning'>Pending</span>
                                        }
                                        {row.student_status==true &&
                                            <span className='badge rounded-pill bg-success'>Completed</span>
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

export default ShowAssignment
