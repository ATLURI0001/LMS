import React from 'react'
import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom';
import { useEffect } from 'react'
import { useState } from 'react'
import Swal from 'sweetalert2'
import axios from 'axios'

const baseUrl='https://minipro.pythonanywhere.com/api'

const Category = () => {
  useEffect(()=>{
    document.title='LMS | Our Categories'
  })

  const [categoryData, setCategoryData]=useState([]);

  useEffect(()=>{
    try{
        axios.get(baseUrl+'/category/')
        .then((res)=>{
            setCategoryData(res.data)
        });
    }catch(error){
        console.log(error);
    }
  },[]);

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className='container mt-4'>
  <div class=" mt-3 text-center wow fadeInUp">
                <h6 class="section-title bg-white text-center text-primary px-3">Categories</h6>
                <h1 class="mb-5">Our Categories</h1>
            </div>    
<div className='row mb-4'>
      {categoryData && categoryData.map((row,index) =>
      <div className='col-md-3 mb-3'>
        <div className="card">
          <div className="card-body">
            <h5 className="card-title"><Link to={`/course/${row.id}/${row.title}`}>{row.title}  ({row.total_courses})</Link></h5>
            <p className='card-text'>{row.description}</p>
          </div>
        </div>
      </div>
      )}
    </div>
  </div>
  )
}

export default Category
