import React from 'react'
import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom';
import { useEffect } from 'react'
import { useState } from 'react'
import Swal from 'sweetalert2'
import axios from 'axios'

const baseUrl='https://minipro.pythonanywhere.com/api'

const Faq = () => {
  useEffect(()=>{
    document.title="LMS | FAQ's Help "
  })

  const [faqData, setFaqData]=useState([]);

  useEffect(()=>{
    try{
        axios.get(baseUrl+'/faq/')
        .then((res)=>{
            setFaqData(res.data)
        });
    }catch(error){
        console.log(error);
    }
  },[]);

  return (
    <div className='container mt-4'>
    <h3 className=' pb-1 mb-4 mt-5'>FAQ's</h3>
      <div className="accordion" id="accordionExample">
      {faqData && faqData.map((row,index) =>
      <div className="accordion-item">
      <h2 className="accordion-header" id="headingOne">
        <button className="accordion-button">
          {row.question}
        </button>
      </h2>
        {index==0 && index++ ||
            <div className="accordion-body">
                {row.answer}
            </div>
        }  
        </div>
      )}
    </div>
  </div>
  )
}

export default Faq