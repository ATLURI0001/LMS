import React from 'react'

const TeacherLogout = () => {
    localStorage.removeItem('teacherLoginStatus')
    window.location.href='/teacher-login';
  return (
    <div>
      
    </div>
  )
}

export default TeacherLogout
