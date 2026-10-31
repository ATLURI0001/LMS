import React from 'react'
import { Link, useParams } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import Message from '../Message'
import MessageStudent from './MessageStudent'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const baseUrl='https://minipro.pythonanywhere.com/api'

const MyTeachers = () => {

    const studentId=localStorage.getItem('studentId')
    const [teacherData,setteacherData]=useState([])

    useEffect(()=>{
        try{
            axios.get(baseUrl+'/fetch-my-teachers/'+studentId)
            .then((res)=>{
                setteacherData(res.data)
            });
        }catch(error){
            console.log(error)
        }
      },[]);

      const [successMsg,setsuccessMsg]=useState('')
      const [errorMsg,seterrorMsg]=useState('')

      const [msgData,setMsgData]=useState({
        msg_to:''
      });

      const handleChange=(event)=>{
        setMsgData({
            ...msgData,
            [event.target.name]:event.target.value
        });
      }

      const formSubmit=(teacher_id)=>{
        const _formData=new FormData()
        _formData.append('msg_to',msgData.msg_to);
        _formData.append('msg_from','student');

        try{
            axios.post(baseUrl+'/send-message/'+teacher_id+'/'+studentId,_formData)
            .then((res)=>{
                if(res.data.bool==true){
                    setMsgData({
                        'msg_to':''
                    })
                    setsuccessMsg(res.data.msg)
                    seterrorMsg('')
                }else{
                    setsuccessMsg('')
                    seterrorMsg(res.data.msg)
                }
            });
        }catch(error){
            console.log(error);
        }
      };

    useEffect(()=>{
        document.title='LMS | My Teachers'
      })

      const msgList={
        height:'500px',
        overflow:'hidden'
      }

  return (
    <div className='container mt-4'>
        <div className='row'>
            <aside className='col-md-3'>
                <Sidebar />
            </aside>
            <section className='col-md-9'>
                <div className='card'>
                    <h5 className='card-header'><i class="bi bi-person-check-fill"/> My Teachers</h5>
                    <div className='card-body  table-responsive'>
                        <table className='table table-striped table-hover'>
                            <thead>
                                <tr>
                                    <th  className='text-center'>Instructer</th>
                                    <th className='text-center'>Name</th>
                                    <th className='text-center'>Chat</th>
                                </tr>
                            </thead>
                            <tbody>
                            {teacherData.map((row,index) =>
                                <tr>
                                    <td  className='text-center'><Link to={`/teacher-detail/`+row.teacher.id}><img className='imgmeet' src={row.teacher.profile_img}/></Link></td>
                                    <td className='text-center'><Link to={`/teacher-detail/`+row.teacher.id}>{row.teacher.full_name}</Link></td>
                                    <td className='text-center'>
                                    <button data-bs-toggle="modal" data-bs-target={`#msgModal${index}`} className='btn btn-sm btn-success mb-2'><i className="bi bi-whatsapp"></i></button>

<div className="modal fade" id={`msgModal${index}`} tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
<div className="modal-dialog  modal-fullscreen">
    <div className="modal-content">
    <div className="modal-header">
        <h5 className="modal-title" id="exampleModalLabel"><h4 className='text-danger'>{row.teacher.full_name}</h4></h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>

    <div className="modal-body">
        <div className='row'>
            <div className='col-md-8 mb-2 col-12 border-end' style={msgList}>
                <MessageStudent teacher_id={row.teacher.id} student_id={studentId}/>
            </div>
            <div className='col-md-4 col-12'>
                {successMsg && <p className='text-success'>{successMsg}</p>}
                {errorMsg && <p className='text-danger'>{errorMsg}</p>}
            <form>
                <div className="mb-3">
                    <label for="exampleInputEmail1" className="form-label">Message</label>
                    <textarea className='form-control' value={msgData.msg_to} name='msg_to' rows="10" onChange={handleChange}></textarea>
                </div>
                <button type="button" className='btn btn btn-sm btn-success' onClick={()=>formSubmit(row.teacher.id)} >
                <i class="bi bi-cursor"></i>             </button>
            </form>
            </div>
        </div>   
    </div>
    </div>
</div>
</div>
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

export default MyTeachers
