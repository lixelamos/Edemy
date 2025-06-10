import Course from "../models/Course.js";

// get all courses

export const getAllCourse = async (req,res) => {
    try {
        const courses = await Course.find({isPublished: true}).select(['-courseContent','-enrolledStudents']).populate({path: 'educator'})
        console.log("Available courses:", courses.map(course => ({ id: course._id, title: course.courseTitle })));
        
        res.json ({success: true, courses})
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.json({success: false, message:error.message})
    }
}


// get course by id

export const getCourseId = async(req,res)=>{
    const {id} = req.params 
    try {
        console.log("Attempting to find course with ID:", id);
        const courseData = await Course.findById(id).populate({path:'educator'});
        console.log("Found course data:", courseData ? {
            id: courseData._id,
            title: courseData.courseTitle,
            hasContent: !!courseData.courseContent,
            contentLength: courseData.courseContent?.length,
            educator: courseData.educator
        } : "Course not found");

        if (!courseData) {
            console.log("Course not found for ID:", id);
            return res.json({ success: false, message: "Course not found" });
        }

        // Remove lecture Url if previewFrese is false
        if (courseData.courseContent && Array.isArray(courseData.courseContent)) {
            console.log("Processing course content:", {
                chapters: courseData.courseContent.length,
                firstChapter: courseData.courseContent[0]?.chapterTitle
            });
            
            courseData.courseContent.forEach(chapter => {
                if (chapter.chapterContent && Array.isArray(chapter.chapterContent)) {
                    chapter.chapterContent.forEach(lecture => {
                        if(!lecture.isPreviewFree){
                            lecture.lectureurl = "";
                        }
                    });
                }
            });
        } else {
            console.log("Course content is missing or invalid:", courseData.courseContent);
        }

        console.log("Sending course data response");
        res.json({success:true, courseData})
        
    } catch (error) {
        console.error("Error in getCourseId:", error);
        res.json({success: false, message:error.message})
    }
}