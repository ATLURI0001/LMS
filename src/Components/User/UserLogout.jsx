import React from 'react'

const UserLogout = () => {
    localStorage.removeItem('studentLoginStatus')
    window.location.href='/user-login';
  return (
    <div>
      
    </div>
  )
}

export default UserLogout
