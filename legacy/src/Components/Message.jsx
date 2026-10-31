import React from 'react'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'

const baseUrl='https://minipro.pythonanywhere.com/api'

const Message = (props) => {
    
    const [msgData, setMsgData]=useState([]);

    useEffect(()=>{
        try{
            axios.get(baseUrl+'/get-message/'+props.teacher_id+'/'+props.student_id)
            .then((res)=>{
                setMsgData(res.data)
            });
        }catch(error){
            console.log(error)
        }
      },[]);
      
      const fetchMsgs = () =>{
        try{
            axios.get(baseUrl+'/get-message/'+props.teacher_id+'/'+props.student_id)
            .then((res)=>{
                setMsgData(res.data)
                const objDiv=document.getElementById("msgList");
                objDiv.scrollTop=objDiv.scrollHeight
            });
        }catch(error){
            console.log(error)
        }
      }

      const msgList={
        height:'500px',
        overflow:'auto'
        
      }

  return (
    <>
    <p><span className='btn btn-sm btn-secondary' onClick={fetchMsgs} title='Refresh'><i className='bi bi-bootstrap-reboot '></i></span></p>
    <div style={msgList} id="msgList">
       {msgData.map((row,index) => 
        <div className='row mb-4'>
            {row.msg_from != 'teacher' && 
               <div className='col-5'>
               <div className='alert alert-dark mb-1 ms-3 rounded-lg'>
                   {row.msg_to}
               </div>
               <small className='text-muted ms-3'>{row.msg_time}</small>
           </div>
            }
            {row.msg_from == 'teacher' && 
               <div className='col-5 offset-7'>
               <div className='alert alert-info mb-1 me-4 rounded-lg'>
                   {row.msg_to}
               </div>
               <small className='text-muted me-4'>{row.msg_time}</small>
           </div>
            }
        </div>
        )}
    </div>
    </>
  )
}

export default Message
