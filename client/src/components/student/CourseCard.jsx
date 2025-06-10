import React, { useContext } from 'react'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'
import { Link } from 'react-router-dom'

const CourseCard = ({course}) => {
  const {currency, calculateRating} = useContext(AppContext)
  
  if (!course || !course._id) {
    console.error("Invalid course data:", course);
    return null;
  }

  const handleClick = () => {
    console.log("Navigating to course:", { 
      id: course._id, 
      title: course.courseTitle,
      price: course.coursePrice,
      discount: course.discount,
      currency: currency || '$'
    });
    window.scrollTo(0, 0);
  }

  const educatorName = typeof course.educator === "object" ? 
    course.educator?.name : 
    course.educator || "Unknown Educator";

  const price = course.coursePrice - (course.discount * course.coursePrice / 100);
  const rating = calculateRating(course);
  const ratingsCount = Array.isArray(course.courseRatings) ? course.courseRatings.length : 0;
  const displayCurrency = currency || '$';

  return (
    <Link to={'/course/' + course._id} onClick={handleClick} 
    className='border border-gray-500/30 pb-6 overflow-hidden rounded-lg'>
      <img className='w-full' src={course.courseThumbnail} alt="courseThumbnail" />
      <div className='p-3 text-left'>
        <h3 className='text-base font-semibold'>{course.courseTitle}</h3>
        <span>{educatorName}</span>        
        <div className='flex items-center space-x-2'>
          <p>{rating}</p>
          <div className='flex'>
            {[...Array(5)].map((_,i)=>(
              <img className='w-3.5 h-3.5' key={i} src={i<Math.floor(rating) ? assets.star : assets.star_blank} alt='star' />
            ))}
          </div>
          <p className='text-gray-500'>{ratingsCount}</p>
        </div>
        <p className='text-base font-semibold text-gray-800'>{displayCurrency} {price.toFixed(2)}</p>
      </div>
    </Link>
  )
}

export default CourseCard