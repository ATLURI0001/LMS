import React from 'react'
import Home from './Home'
import Header from './Header'
import Footer from './Footer'
import CourseDetail from './CourseDetail'
import TeacherDetails from './TeacherDetails'
import { BrowserRouter, Routes,Route } from 'react-router-dom';
import About from './About';
import Login from './User/Login'
import Register from './User/Register'
import Dashboard from './User/Dashboard'
import MyCourses from './User/MyCourses'
import FavoriteCourses from './User/FavoriteCourses'
import RecomemdedCourses from './User/RecomemdedCourses'
import ProfileSetting from './User/ProfileSetting'
import ChangePassword from './User/ChangePassword'
import TeacherLogin from './Teacher/TeacherLogin'
import TeacherRegister from './Teacher/TeacherRegister'
import TeacherDashboard from './Teacher/TeacherDashboard'
import TeacherChangePassword from './Teacher/TeacherChangePassword'
import TeacherProfileSetting from './Teacher/TeacherProfileSetting'
import TeacherMyCourses from './Teacher/TeacherMyCourses'
import AddCourse from './Teacher/AddCourses'
import MyUsers from './Teacher/MyUsers'
import AllCourses from '../AllCourses'
import PopularCourses from '../PopularCourses'
import TeacherLogout from './Teacher/TeacherLogout'
import CategoryCourses from '../CategoryCourses'
import AddChapter from './Teacher/AddChapter'
import AllChapters from './Teacher/CourseChapters'
import EditChapter from './Teacher/EditChapter'
import EditCourse from './Teacher/EditCourse'
import TeacherSkillCourses from './Teacher/TeacherSkillCourses'
import UserLogout from './User/UserLogout'
import EnrolledStudents from './Teacher/EnrolledStudents'
import AddAssignment from './Teacher/AddAssignment'
import ShowAssignment from './Teacher/ShowAssignment'
import StudentAssignments from './User/StudentAssignments'
import AddQuiz from './Teacher/AddQuiz'
import AllQuiz from './Teacher/AllQuiz'
import EditQuiz from './Teacher/EditQuiz'
import CourseQuizList from './User/CourseQuizList'
import TakeQuiz from './User/TakeQuiz'
import QuizQuestions from './Teacher/QuizQuestions'
import AddQuizQuestion from './Teacher/AddQuizQuestion'
import AssignQuiz from './Teacher/AssignQuiz'
import Search from './Search'
import StudyMaterial from './Teacher/StudyMaterial'
import AddStudyMaterial from './Teacher/AddStudyMaterial'
import StudyStudentMaterial from './User/StudyStudentMaterial'
import AttemptedStudent from './Teacher/AttemptedStudent'
import Category from '../Category'
import Faq from './Faq'
import Pages from './Pages'
import MyTeachers from './User/MyTeachers'
import AttemptedQuiz from './Teacher/AttemptedQuiz'
import MiniVideoPlayer from './MiniVideoPlayer'
import { useEffect } from 'react'
import Policy from './Policy'

const Main = () => {

  return (
      <BrowserRouter>
      <Header />
      <Routes>
          <Route path='/user-login' element={<Login />}/>
          <Route path='/' element={<Home />}/>
          <Route path='/detail/:course_id' element={<CourseDetail />}/>
          <Route path='/user-register' element={<Register />}/>
          <Route path='/user-dashboard' element={<Dashboard />}/>
          <Route path='/my-courses' element={<MyCourses />}/>
          <Route path='/my-teachers' element={<MyTeachers />}/>
          <Route path='/favorite-courses' element={<FavoriteCourses />}/>
          <Route path='/recommended-courses' element={<RecomemdedCourses/>}/>
          <Route path='/profile-setting' element={<ProfileSetting/>}/>
          <Route path='/change-password' element={<ChangePassword/>}/>
          <Route path='/teacher-login' element={<TeacherLogin />}/>
          <Route path='/teacher-logout' element={<TeacherLogout />}/>
          <Route path='/user-logout' element={<UserLogout />}/>
          <Route path='/teacher-register' element={<TeacherRegister />}/>
          <Route path='/teacher-dashboard' element={<TeacherDashboard />}/>
          <Route path='/teacher-change-password' element={<TeacherChangePassword  />}/>
          <Route path='/teacher-profile-setting' element={<TeacherProfileSetting  />}/>
          <Route path='/teacher-my-course' element={<TeacherMyCourses  />}/>
          <Route path='/add-course' element={<AddCourse  />}/>
          <Route path='/add-quiz' element={<AddQuiz  />}/>
          <Route path='/quiz' element={<AllQuiz  />}/>
          <Route path='/all-questions/:quiz_id' element={<QuizQuestions  />}/>
          <Route path='/course-quiz/:course_id' element={<CourseQuizList  />}/>
          <Route path='/take-quiz/:quiz_id' element={<TakeQuiz  />}/>
          <Route path='/edit-quiz/:quiz_id' element={<EditQuiz  />}/>
          <Route path='/edit-question/:quiz_id' element={<EditQuiz  />}/>
          <Route path='/add-chapter/:course_id' element={<AddChapter  />}/>
          <Route path='/add-question/:quiz_id' element={<AddQuizQuestion  />}/>
          <Route path='/my-users' element={<MyUsers  />}/>
          <Route path='/teacher-detail/:teacher_id' element={<TeacherDetails  />}/>
          <Route path='/all-chapters/:course_id' element={<AllChapters  />}/>
          <Route path='/study-material/:course_id' element={<StudyMaterial  />}/>
          <Route path='/edit-chapter/:chapter_id' element={<EditChapter  />}/>
          <Route path='/edit-course/:course_id' element={<EditCourse  />}/>
          <Route path='/all-courses' element={<AllCourses  />}/>\
          <Route path='/popular-courses' element={<PopularCourses  />}/>
          <Route path='/teacher-skill-courses/:skill_name/:teacher_id' element={<TeacherSkillCourses />}/>    
          <Route path='/course/:category_id/:category_slug' element={<CategoryCourses />}/>    
          <Route path='/category' element={<Category />}/>    
          <Route path='/enrolled-students/:course_id' element={<EnrolledStudents  />}/>
          <Route path='/add-assignment/:student_id/:teacher_id' element={<AddAssignment />}/>    
          <Route path='/show-assignment/:student_id/:teacher_id' element={<ShowAssignment />}/>    
          <Route path='/my-assignments/' element={<StudentAssignments />}/>    
          <Route path='/assign-quiz/:course_id' element={<AssignQuiz  />}/>
          <Route path='/search/:searchstring' element={<Search  />}/>
          <Route path='/add-study/:course_id' element={<AddStudyMaterial  />}/>
          <Route path='/user/study-material/:course_id' element={<StudyStudentMaterial  />}/>
          <Route path='/attempted-students/:quiz_id' element={<AttemptedQuiz  />}/>
          <Route path='/faq' element={<Faq />}/>
          <Route path='/page/:page_id/:page_slug' element={<Pages />}/>
          <Route path='/mini/:course_id' element={<MiniVideoPlayer  />}/>
          <Route path='/aboutus' element={<About />}/>
          <Route path='/policy' element={<Policy />}/>
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default Main
