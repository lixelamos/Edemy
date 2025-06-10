import React, { useContext, useEffect, useState, useCallback } from 'react';
import { AppContext } from '../../context/AppContext';
import Loading from '../../components/student/Loading';
import axios from 'axios';
import { toast } from 'react-toastify';
import Logger from '../../components/Logger';

const MyCourses = () => {
  const { currency, allCourses, backendUrl, isEducator, getToken } = useContext(AppContext);
  const [courses, setCourses] = useState(null);

  const fetchEducatorCourses = useCallback(async () => {
    setCourses(allCourses); // Temporary fallback data
    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendUrl}/api/educator/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data && data.success && Array.isArray(data.courses)) {
        console.log("Fetched courses:", data.courses); // Debug
        setCourses(data.courses);
      } else {
        console.warn("Unexpected data from API:", data);
      }
    } catch (error) {
      toast.error(error.message);
      console.error("Fetch error:", error);
    }
  }, [allCourses, getToken, backendUrl]);

  useEffect(() => {
    if (isEducator) {
      fetchEducatorCourses();
    }
  }, [isEducator, fetchEducatorCourses]);

  return courses ? (
    <div className="h-full mb-10 flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0">
      <div className="w-full">
        <div className="block sm:hidden">
          <Logger />
        </div>
        <h2 className="pb-4 text-lg font-medium">My Courses</h2>
        <div className="flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
          <table className="md:table-auto table-fixed w-full overflow-hidden">
            <thead className="text-gray-900 border-b border-gray-500/20 text-sm text-left">
              <tr>
                <th className="px-4 py-3 font-semibold truncate">All Courses</th>
                <th className="px-4 py-3 font-semibold truncate">Courses Price</th>
                <th className="px-4 py-3 font-semibold truncate">Earnings</th>
                <th className="px-4 py-3 font-semibold truncate">Students</th>
                <th className="px-4 py-3 font-semibold truncate">Course Status</th>
              </tr>
            </thead>

            <tbody className="text-sm text-gray-500">
              {courses.map((course) => {
                const price = course.coursePrice - (course.discount * course.coursePrice) / 100;
                const displayPrice = price === 0 ? "Free" : `${currency} ${price}`;
                const studentCount = course.enrolledStudents?.length || 0;
                const earnings = price === 0 ? 0 : Math.floor(studentCount * price).toFixed(2);

                return (
                  <tr key={course._id} className="border-b border-gray-500/20">
                    <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 truncate">
                      <img
                        src={course.courseThumbnail}
                        alt="CourseImage"
                        className="w-16"
                      />
                      <span className="truncate hidden md:block">{course.courseTitle}</span>
                    </td>
                    <td className="px-4 py-3">{displayPrice}</td>
                    <td className="px-4 py-3">{currency} {earnings}</td>
                    <td className="px-4 py-3">{studentCount}</td>
                    <td className="px-4 py-3">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default MyCourses;
