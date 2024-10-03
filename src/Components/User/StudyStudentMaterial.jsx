import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import axios from 'axios'
import Sidebar from './Sidebar'

const baseUrl='https://minipro.pythonanywhere.com/api'

const StudyStudentMaterial = () => {

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

    const downloadFile = (file_url)=>{
        window.location.href=file_url;
    }

    const Swal = require('sweetalert2');

  return (
    <div className='container mt-4'>
    <div className='row'>
        <aside className='col-md-3'>
            <Sidebar />
        </aside>
        <section className='col-md-9'>
            <div className='card'>
                <h5 className='card-header'> All study Materials ({totalResult})</h5>
                <div className='card-body table-responsive'>
                    <table className='table table-bordered'>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Details</th>
                                <th>Study Materials</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studyData.map((row,index) => 
                            <tr>
                                <td>{row.title}</td>
                                <td>{row.description}</td>
                                <td>
                                    <button className='btn btn-success btn-sm' value="download" onClick={()=>downloadFile(row.upload)}>Download Files</button>
                                </td>
                                <td>{row.remarks}</td>
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

export default StudyStudentMaterial

