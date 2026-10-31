import React from 'react'
import TeacherSidebar from './TeacherSidebar'
import { useEffect } from 'react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import axios from 'axios'

const baseUrl='https://minipro.pythonanywhere.com/api'

const StudyMaterial = () => {

    const [studyData, setStudyData]=useState([]);
    const [totalResult, settotalResult]=useState([0]);    
    const {course_id}=useParams();

    useEffect(()=>{
      try{
          axios.get(baseUrl+'/study-material/'+course_id)
          .then((res)=>{
            settotalResult(res.data.length)
            setStudyData(res.data)
          });
      }catch(error){
          console.log(error);
      }
    },[]);

    const Swal = require('sweetalert2');

    const handleDeleteClick = (study_id) =>{
        Swal.fire({
            title: 'Confirm',
            text: 'Are you sure you want to delete data?',
            icon: 'info',
            confirmButtonText: 'Continue',
            showCancelButton:true
          }).then((result)=>{
            if(result.isConfirmed){
                try{
                    axios.delete(baseUrl+'/study-materials/'+study_id)
                    .then((res)=>{
                        Swal.fire('success','Data has been deleted Successfully')
                        try{
                            axios.get(baseUrl+'/study-material/'+course_id)
                            .then((res)=>{
                              settotalResult(res.data.length)
                              setStudyData(res.data)
                            });
                        }catch(error){
                            console.log(error);
                        }
                    })
            }catch(error){
                Swal.fire('error','Data has not been deleted !!');
            }
            }
            else{
                Swal.fire('error','Data has not been deleted !!');
            }
          })
    }

    const downloadFile = (file_url)=>{
        window.location.href=file_url;
    }

  return (
    <div className='container mt-4'>
    <div className='row'>
        <aside className='col-md-3'>
            <TeacherSidebar />
        </aside>
        <section className='col-md-9'>
            <div className='card'>
                <h5 className='card-header'> All study Materials ({totalResult}) <Link className='btn btn-success btn-sm float-end ' to={'/add-study/'+course_id}>Add Study Material</Link></h5>
                <div className='card-body table-responsive'>
                    <table className='table table-bordered'>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Upload</th>
                                <th>Remarks</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studyData.map((row,index) => 
                            <tr>
                                <td>{row.title}</td>
                                <td><button className='btn btn-outline-success' onClick={()=>downloadFile(row.upload)}>Download Files</button></td>
                                <td>{row.remarks}</td>
                                <td>
                                    <button onClick={()=>handleDeleteClick(row.id)} className='btn btn-danger  ms-2 btn-sm'><i className='bi bi-trash'></i></button>
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

export default StudyMaterial
