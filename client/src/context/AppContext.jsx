import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const currency = import.meta.env.VITE_CURRENCY || '$';
    const navigate = useNavigate();

    const { getToken, isLoaded: isAuthLoaded } = useAuth();
    const { user, isLoaded: isUserLoaded } = useUser();

    const [allCourses, setAllCourses] = useState([]);
    const [isEducator, setIsEducator] = useState(true);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [userData, setUserData] = useState(null);

    // Fetch all courses
    const fetchAllCourses = async () => {
        try {
            const { data } = await axios.get(backendUrl + "/api/course/all");
            if (data.success) {
                setAllCourses(data.courses);
            } else {
                toast.error(data.message);
                setAllCourses([]);
            }
        } catch (error) {
            toast.error(error.message);
            setAllCourses([]);
        }
    };

    // Fetch user data
    const fetchUserData = async () => {
        if (user?.publicMetadata?.role === "educator") {
            setIsEducator(true);
        } else {
            setIsEducator(false);
        }

        try {
            const token = await getToken();
            if (!token) {
                toast.error("User token is missing.");
                return;
            }

            const { data } = await axios.get(backendUrl + "/api/user/data", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (data.success && data.user) {
                setUserData(data.user);
            } else {
                toast.error(data.message || "User not found or unauthorized!");
                setUserData(null);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
            setUserData(null);
        }
    };

    // Fetch enrolled courses
    const fetchUserEnrolledCourses = async () => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error("Missing token. Please log in.");
                return;
            }

            const response = await axios.get(backendUrl + "/api/user/enrolled-courses", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data && response.data.enrolledCourses) {
                setEnrolledCourses(response.data.enrolledCourses.reverse());
            } else {
                toast.error(response.data?.message || "No enrolled courses found.");
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
            toast.error(error.response?.data?.message || error.message);
        }
    };

    // Calculate average rating
    const calculateRating = (course) => {
        if (!Array.isArray(course.courseRatings) || course.courseRatings.length === 0) {
            return 0;
        }
        let totalRating = 0;
        course.courseRatings.forEach((rating) => {
            totalRating += rating.rating;
        });
        return Math.floor(totalRating / course.courseRatings.length);
    };

    // Calculate chapter time
    const calculateChapterTime = (chapter) => {
        if (!Array.isArray(chapter.chapterContent)) return "0m";
        let time = 0;
        chapter.chapterContent.forEach((lecture) => (time += lecture.lectureDuration));
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
    };

    // Calculate total course duration
    const calculateCourseDuration = (course) => {
        if (!Array.isArray(course.courseContent)) return "0m";
        let time = 0;
        course.courseContent.forEach((chapter) => {
            if (Array.isArray(chapter.chapterContent)) {
                chapter.chapterContent.forEach((lecture) => (time += lecture.lectureDuration));
            }
        });
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
    };

    // Count number of lectures
    const calculateNoOfLectures = (course) => {
        let totalLectures = 0;
        if (Array.isArray(course.courseContent)) {
            course.courseContent.forEach((chapter) => {
                if (Array.isArray(chapter.chapterContent)) {
                    totalLectures += chapter.chapterContent.length;
                }
            });
        }
        return totalLectures;
    };

    const logToken = async () => {
        const token = await getToken();
        console.log("Token:", token);
        if (!token) {
            toast.error("No token available. You may not be signed in.");
        }
    };

    // Initial course fetch
    useEffect(() => {
        fetchAllCourses();
    }, []);

    // User-dependent data fetch
    useEffect(() => {
        if (isUserLoaded && isAuthLoaded && user) {
            fetchUserData();
            logToken();
            fetchUserEnrolledCourses();
        }
    }, [isUserLoaded, isAuthLoaded, user]);

    const value = {
        currency,
        allCourses: allCourses || [],
        navigate,
        isEducator,
        setIsEducator,
        calculateRating,
        calculateChapterTime,
        calculateCourseDuration,
        calculateNoOfLectures,
        fetchUserEnrolledCourses,
        setEnrolledCourses,
        enrolledCourses: enrolledCourses || [],
        backendUrl,
        userData,
        setUserData,
        getToken,
        fetchAllCourses,
    };

    return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};