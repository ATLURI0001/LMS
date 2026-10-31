import React from 'react'
import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom';
import { useEffect } from 'react'
import { useState } from 'react'
import Swal from 'sweetalert2'
import axios from 'axios'
import "./Me.css"

const baseUrl='https://minipro.pythonanywhere.com/api'

const MiniVideoPlayer = () => {

    let {course_id}=useParams();

    const [courseData, setCourseData]=useState([]);
    const [chapterData, setChapterData]=useState([]);
    const [teacherData, setTeacherData]=useState([]);
    const [teachListData, setTeachListData]=useState([]);
    const [relatedCourseData, setRelatedCourseData]=useState([]);
    const [userLoginStatus,setUserLoginStatus]=useState([])
    const [enrolledStatus,setEnrolledStatus]=useState([])
    const [ratingStatus,setRatingStatus]=useState([])
    const [favoriteStatus,setFavoriteStatus]=useState([])
    const [courseViews,setCourseViews]=useState(0)
    const [avgRating,setAvgRating]=useState(0)
    const studentId=localStorage.getItem('studentId')

    useEffect(()=>{
      try{
          axios.get(baseUrl+'/course/'+course_id)
          .then((res)=>{
            setChapterData(res.data.course_chapters)
            setTeacherData(res.data.teacher)
            setCourseData(res.data)
            setRelatedCourseData(JSON.parse(res.data.related_videos))
            setTeachListData(res.data.teach_list)
            if(res.data.course_rating!='' && res.data.course_rating!=null){
              setAvgRating(res.data.course_rating)
            }
          });

          axios.get(baseUrl+'/update-view/'+course_id)
          .then((res) => {
            setCourseViews(res.data.views)
          })
      }catch(error){
          console.log(error);
      }
      try{
        axios.get(baseUrl+'/fetch-enroll-status/'+studentId+'/'+course_id)
        .then((res)=>{
          if(res.data.bool==true){
            setEnrolledStatus('success')
          }
        });
      }catch(error){
          console.log(error);
      }

      try{
        axios.get(baseUrl+'/fetch-rating-status/'+studentId+'/'+course_id)
        .then((res)=>{
          if(res.data.bool==true){
            setRatingStatus('success')
          }
        });
      }catch(error){
          console.log(error);
      }

      try{
        axios.get(baseUrl+'/fetch-favorite-status/'+studentId+'/'+course_id)
        .then((res)=>{
          if(res.data.bool==true){
            setFavoriteStatus('success')
          }else{
            setFavoriteStatus('');
          }
        });
      }catch(error){
          console.log(error);
      }

      const studentLoginStatus=localStorage.getItem('studentLoginStatus');
      if(studentLoginStatus=='true'){
        setUserLoginStatus('success')
    }
    },[]);
    useEffect(() => {
      window.scrollTo(0, 0)
    }, [])

    const enrollCourse = () =>{
        const _formData=new FormData();
        _formData.append('course',course_id);
        _formData.append('student',studentId);

        try{
            axios.post(baseUrl+'/student-enroll-course/',_formData,{
                headers: {
                    'content-type':'multipart/form-data'
                }
            })
            .then((res)=>{
              if(res.status==200 || res.status==201){
                Swal.fire({
                    title:'You Successfully Enrolled!',
                    icon:'success',
                    toast:true,
                    timer:3000,
                    position:'top-right',
                    timerProgressBar: true,
                    showConfirmButton: false
                });
                setEnrolledStatus('success')
            }
            });
        }catch(error){
            console.log(error);
        }
    }

    const [ratingData,setRatingData]=useState({
      rating:'',
      reviews:''
    });

    const handleChange=(event)=>{
      setRatingData({
          ...ratingData,
          [event.target.name]:event.target.value
      });
    }

    const formSubmit=()=>{
      const _formData=new FormData();
      _formData.append('course',course_id);
      _formData.append('student',studentId);
      _formData.append('rating',ratingData.rating);
      _formData.append('reviews',ratingData.reviews);

      try{
          axios.post(baseUrl+'/course-rating/',_formData,)
          .then((res)=>{
              if(res.status==200 || res.status==201){
                  Swal.fire({
                      title:'Rated Successfully!',
                      icon:'success',
                      toast:true,
                      timer:3000,
                      position:'top-right',
                      timerProgressBar: true,
                      showConfirmButton: false
                  });
              }
          });
      }catch(error){
          console.log(error);
      }
    };

    const markAsFav=()=>{
      const _formData=new FormData();
      _formData.append('course',course_id);
      _formData.append('student',studentId);
      _formData.append('status',true);

      try{
          axios.post(baseUrl+'/student-add-favorte-course/',_formData,{
            headers: {
              'content-type':'multipart/form-data'
          }
          })
          .then((res)=>{
              if(res.status==200 || res.status==201){
                  Swal.fire({
                      title:'This Course Successfully added to your Favorite list',
                      icon:'success',
                      toast:true,
                      timer:3000,
                      position:'top-right',
                      timerProgressBar: true,
                      showConfirmButton: false
                  });
                  setFavoriteStatus('success')
              }
          });
      }catch(error){
          console.log(error);
      }
    };

    const removeFav=(pk)=>{
      const _formData=new FormData();
      _formData.append('course',course_id);
      _formData.append('student',studentId);
      _formData.append('status',false);

      try{
          axios.get(baseUrl+'/student-remove-favorite-course/'+course_id+'/'+studentId,{
            headers: {
              'content-type':'multipart/form-data'
          }
          })
          .then((res)=>{
              if(res.status==200 || res.status==201){
                  Swal.fire({
                      title:'This Course Successfully removed from your Favorite list',
                      icon:'success',
                      toast:true,
                      timer:3000,
                      position:'top-right',
                      timerProgressBar: true,
                      showConfirmButton: false
                  });
                  setFavoriteStatus('')
              }
          });
      }catch(error){
          console.log(error);
      }
    };
    

    useEffect(()=>{
      document.title='LMS | Courses Details'
    })


  return (
<>
<meet>
<div class="you">
  {chapterData.map((chapter,index) => (  
<>
<div class="videos">
    <video src={chapter.video} controls></video>
    <div className='head'>{chapter.title}</div>
  </div>
</>
  ))}
  </div>
   </meet>

</>
  )
}

export default MiniVideoPlayer
