import React from 'react'
import { Route, Routes, useMatch } from 'react-router-dom'
import Home from '../src/pages/student/Home'
import CoursesList from '../src/pages/student/CoursesList'
import CourseDetails from '../src/pages/student/CourseDetails'
import MyEnrollments from '../src/pages/student/MyEnrollments'
import Player from '../src/pages/student/Player'
import Loading from '../src/components/student/Loading'
import Educator from '../src/pages/educator/Educator'
import Dashboard from '../src/pages/educator/Dashboard'
import AddCourse from '../src/pages/educator/AddCourse'
import MyCourses from '../src/pages/educator/MyCourses'
import StudentsEnrolled from '../src/pages/educator/StudentsEnrolled'
import Navbar from '../src/components/student/Navbar'
import "quill/dist/quill.snow.css";
import { ToastContainer } from 'react-toastify';
import About from '../src/components/About'
import ContactForm from '../src/components/ContactForm'


const App = () => {


  const isEducatorRoute = useMatch('/educator/*')



  return (
    <div className='text-default min-h-screen bg-white'>
      <ToastContainer />
      {!isEducatorRoute &&<Navbar/> }
      
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/course/:id' element={<CourseDetails/>} />
        <Route path='/course-list' element={<CoursesList/>} />
        <Route path='/course-list/:input' element={<CoursesList/>} />
        <Route path='/my-enrollments' element={<MyEnrollments/>} />
        <Route path='/player/:courseId' element={<Player/>} />
        <Route path='/loading/:path' element={<Loading/>} />

        <Route path='/about' element={<About/>} />
        <Route path='/contact' element={<ContactForm/>} />

        <Route path='/educator' element={ <Educator />} >
            <Route path='/educator' element={<Dashboard />} />
            <Route path='add-course' element={<AddCourse />} />
            <Route path='my-courses' element={<MyCourses />} />
            <Route path='student-enrolled' element={<StudentsEnrolled />} />
        </Route>

      </Routes>
    </div>
  )
}

export default App