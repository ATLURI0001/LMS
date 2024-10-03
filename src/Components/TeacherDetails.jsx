import React from 'react'
import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom';
import { useEffect } from 'react'
import { useState } from 'react'
import Swal from 'sweetalert2'
import axios from 'axios'
import './main.css'

const baseUrl='https://minipro.pythonanywhere.com/api'

const TeacherDetails = () => {

    let {teacher_id}=useParams();
    const [teacherData, setTeacherData]=useState([]);
    const [courseData, setCourseData]=useState([]);
    const [skillList, setSkillList]=useState([]);

    useEffect(() => {
        window.scrollTo(0, 0)
      }, [])

    useEffect(()=>{
        document.title='LMS | Teachers Details'
      })

      useEffect(()=>{
        try{
            axios.get(baseUrl+'/teacher/'+teacher_id)
            .then((res)=>{
                console.log(res)
                setTeacherData(res.data)
                setCourseData(res.data.teacher_courses)
                setSkillList(res.data.skill_list)
            });
        }catch(error){
            console.log(error);
        }
      },[]);

      const icon={
        'font-size':'25px'
      }

  return (
    <div className='conatiner mt-4 px-4'class='hod'>
        <div className='row'>
            <div class="col-lg-3 col-md-6 wow fadeInUp">
                    <div class="team-item bg-light">
                        <div class=" position-relative overflow-hidden">
                            <img src={teacherData.profile_img} className="card-img-top img-fluid img-thumbnail aks" alt={teacherData.full_name}/>
                        </div>
                    </div>
                </div>
            <div className='col-8'>
                <h3>{teacherData.full_name}</h3>
                <p>{teacherData.detail}</p>
                <p className='fw-bold'>Skills:&nbsp;
                {skillList.map((skill,index) =>                 
                    <span to={`/teacher-skill-courses/${skill.trim()}/${teacherData.id}`} className='badge badge-pill rounded-pill bg-warning text-secoundary ms-1'>{skill.trim()}</span>
                )}   
                </p>              
                <p className='fw-bold'>Total Courses : {teacherData.total_teacher_course}</p>
                <p className='fw-bold'>Contact Teacher : {teacherData.email}</p>
                <p className='fw-bold'>Qualifications : {teacherData.qualification}</p>
                <p className='fw-bold '> Follow Me : <br/>
                {teacherData.face_url &&
                    <a href={teacherData.face_url} style={icon}><i class="bi bi-facebook px-1 "></i></a>
                }
                {teacherData.insta_url &&
                    <a href={teacherData.insta_url} style={icon}><i class="bi bi-instagram ms-1 px-1 text-dark"></i></a>
                }
                {teacherData.twit_url &&
                    <a href={teacherData.twit_url} style={icon}><i class="bi bi-twitter ms-1 px-1"></i></a>
                }
                {teacherData.you_url &&
                    <a href={teacherData.you_url} style={icon}><i class="bi bi-youtube ms-1 px-1 text-danger"></i></a>
                }
                {teacherData.web_url &&
                    <a href={teacherData.web_url} style={icon}><i class="bi bi-globe2 text-dark ms-1 px-1"></i></a>
                }
                </p>

            </div>
        </div>
        {/* Course Videos*/}
        <div className="card mt-4">
            <div className="card-header">
                <h4>Course List</h4>
                <div className='list-group list-group-flush'>
                    {courseData.map((course,index)=>
                        <Link to={`/detail/${course.id}`} class="list-group-item">{course.title}</Link>
                    )}
                </div>
            </div>
        </div>
    </div>
  )
}

export default TeacherDetails
