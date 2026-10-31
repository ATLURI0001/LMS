import React from 'react'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'

const Sidebar = () => {
  useEffect(()=>{
    document.title='LMS | MainMenu'
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
      <div className='card'>
                    <div className='list-group list-group-flush'>
                        <Link to='/user-dashboard' className='list-group-item list-group-item-action'> Dashboard</Link>
                        <Link to='/my-courses' className='list-group-item list-group-item-action'> My Courses  </Link>
                        <Link to='/favorite-courses' className='list-group-item list-group-item-action'> Favorite Courses </Link>
                        <Link to='/my-teachers' className='list-group-item list-group-item-action'> My Teachers </Link>
                        <Link to='/recommended-courses' className='list-group-item list-group-item-action'> Recommended Courses  </Link>
                        <Link to='/my-assignments' className='list-group-item list-group-item-action'>Assignments</Link>
                        <Link to='/profile-setting' className='list-group-item list-group-item-action'> Profile Settings  </Link>
                        <Link to='/change-password' className='list-group-item list-group-item-action'> Change Password </Link>
                        <Link to='/user-logout' className='list-group-item list-group-item-action text-danger'> Logout </Link>
                    </div>
         </div>
  )
}

export default Sidebar
