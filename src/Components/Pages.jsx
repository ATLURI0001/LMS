import React from 'react'
import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom';
import { useEffect } from 'react'
import { useState } from 'react'
import Swal from 'sweetalert2'
import axios from 'axios'

const baseUrl='https://minipro.pythonanywhere.com/api'

const Pages = () => {
    
      const [pageData, setPageData]=useState([]);
      let {page_id,page_slug}=useParams
    
      useEffect(()=>{
        try{
            axios.get(baseUrl+'/pages/'+page_id+'/'+page_slug)
            .then((res)=>{
                setPageData(res.data)
            });
        }catch(error){
            console.log(error);
        }
      },[page_id]);
  return (
    <div>
      <h2>{pageData.title}</h2>
      <h2>{pageData.content}</h2>
    </div>
  )
}

export default Pages
