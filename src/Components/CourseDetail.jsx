import React from 'react'
import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom';
import { useEffect } from 'react'
import { useState } from 'react'
import Swal from 'sweetalert2'
import axios from 'axios'
import './main.css'
import './style.css'
import './bootstrap.min.css'

const baseUrl='https://minipro.pythonanywhere.com/api'
const siteUrl='https://minipro.pythonanywhere.com/'

const CourseDetail = () => {

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

    useEffect(() => {
      window.scrollTo(0, 0)
    }, [])
    
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
    <div className='conatiner mt-4 px-4 hod'>
        <div className='row'>
        <div class="col-lg-3 col-md-6 mt-3">
                    <div class="team-item bg-light">
                        <div class="overflow-hidden">
                        <img src={courseData.featured_img} className="card-img-top img-fluid img-thumbnail" alt={courseData.title}/>            
                        </div>
                    </div>
                </div>
            <div className='col-8 pd-2 mt-3'>
                <h3>{courseData.title}</h3>
                <p>{courseData.description}</p>
                <p className='fw-bold'>Course By : <Link to={`/teacher-detail/${teacherData.id}`}>{teacherData.full_name}</Link></p>
                <p className='fw-bold'>Techs :&nbsp;
                  <a className='text-warning'>{courseData.techs}</a>
                </p>
                <p className='fw-bold'>Total Enrolled &nbsp;<i class="bi bi-person-plus-fill text-info"></i> :&nbsp;{courseData.total_enrolled_students}</p> 
                <p className='fw-bold'>
                Rating : {avgRating} / 5
                {enrolledStatus=='success' && userLoginStatus=='success' &&
                <>
                {ratingStatus != 'success' && 
                  <button className='btn btn-success btn-sm ms-2' data-bs-toggle="modal" data-bs-target="#ratingModal">Rating</button>   
                }
                {ratingStatus == 'success' && 
                  <span className='btn btn-success btn-sm ms-2 rounded-pill mt-2' >You already Rated this Course</span>   
                }
                      <div className="modal fade" id="ratingModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                        <div className="modal-dialog modal-lg">
                          <div className="modal-content">
                            <div className="modal-header">
                              <h5 className="modal-title" id="exampleModalLabel">Rate for {courseData.title}</h5>
                              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body">
                            
                                <div class="mb-3">
                                  <label for="exampleInputEmail1" class="form-label">Rating</label>
                                  <select onChange={handleChange} className='form-control' name='rating'>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                                  </select>
                                </div>
                                <div class="mb-3">
                                  <label for="exampleInputPassword1" class="form-label">Review</label>
                                  <textarea onChange={handleChange} name="reviews" class="form-control" rows="6" />
                                </div>
                                <button onClick={formSubmit} type="submit" class="btn btn-primary">Submit</button>
                              
                            </div>
                          </div>
                        </div>
                        </div>
                  </>
                }  
                </p>
                <p className='fw-bold'>
                    Views: {courseViews}
                </p>
                {userLoginStatus == 'success' && enrolledStatus!=='success' &&
                    <p><button type='button' className='btn btn-success rounded-pill ' onClick={enrollCourse} >Enroll in this Course</button></p>
                }
                {enrolledStatus=='success' && userLoginStatus=='success' &&
                    <p><span className='btn btn-info rounded-pill btn-sm'>You are already Enrolled in this Course</span></p>
                }
                {userLoginStatus == 'success' && favoriteStatus !== 'success' &&
                    <p><button type='button' onClick={markAsFav} title="Add in your favorite Course list" to='/user-login' className='btn btn-outline-danger btn-sm'><i className='bi bi-heart'></i></button></p>
                }
                {userLoginStatus == 'success' && favoriteStatus == 'success' &&
                    <p><button type='button' onClick={removeFav} title="Add in your favorite Course list" to='/user-login' className='btn btn-outline-danger btn-sm'><i className='bi bi-heart-fill'></i></button></p>
                }
                {userLoginStatus !== 'success' && 
                    <p><Link to='/user-login' className='btn btn-danger rounded-pill'>Please login to enjoy this course</Link></p>
                }
            </div>
        </div>
        {/* Course Videos*/}
      {userLoginStatus == 'success' && enrolledStatus=='success' &&
      <>
        <div className="card mt-4">
            <h5 className="card-header">
                Course Contains
            </h5>
            <ul className="list-group list-group-flush">
            {chapterData.map((chapter,index) => (
              <li className="list-group-item" key={chapter.id}>{chapter.title}
              </li>
            ))}
            </ul>
        </div>
        <Link to={`/mini/${courseData.id}`} className='btn btn-sm bg-success mt-2 text-white'>Start Now</Link>
      </>
      }
        <h3 className=' pb-1 mb-4 mt-5'>Related Courses</h3>
      <div className='row mb-4'>
      {relatedCourseData.map((rcourse,index) =>
        <div className='col-md-3 mb-4'>
          <div className="card">
            <Link target='__blank' to={`/detail/${rcourse.pk}`}><img to={`/detail/${rcourse.pk}`} target='__blank' src={`${siteUrl}media/${rcourse.fields.featured_img}`} className="card-img-top fadeInUp" height={200} alt={rcourse.fields.title}/></Link>
              <div className="card-body">
                <h5 className="card-title"><Link to={`/detail/${rcourse.pk}`}>{rcourse.fields.title}</Link></h5>
              </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default CourseDetail
