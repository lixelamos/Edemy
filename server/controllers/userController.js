import Stripe from "stripe"
import Course from "../models/Course.js"
import { Purchase } from "../models/Purchase.js"
import User from "../models/User.js"
import { CourseProgress } from "../models/CourseProgress.js"

// Get users data
export const getUserData = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found!" });
        }
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// User enrolled course with lecture link

export const userEnrolledCourses = async (req,res)=>{
    try {
        const userId = req.auth.userId
        const userData = await User.findById(userId).populate('enrolledCourses')

        res.json({success:true, enrolledCourses: userData.enrolledCourses})


    } catch (error) {
        res.json({success: false, message:error.message})
    }
}


// Purchase course

export const purchaseCourse = async (req,res) => {
    try {
        const {courseId} = req.body
        const {origin} = req.headers
        const userId = req.auth.userId;

        console.log("Purchase request:", {
            courseId,
            origin,
            userId,
            currency: process.env.CURRENCY
        });

        if (!courseId || !origin || !userId) {
            return res.json({success: false, message: "Missing required data"});
        }

        const userData = await User.findById(userId)
        const courseData = await Course.findById(courseId)

        if(!userData || !courseData) {
            console.log("Data not found:", { userData: !!userData, courseData: !!courseData });
            return res.json({success: false, message: "Data Not Found"});
        }

        const purchaseData = {
            courseId: courseData._id,
            userId,
            amount: (courseData.coursePrice - courseData.discount * courseData.coursePrice / 100).toFixed(2),
        }

        console.log("Creating purchase:", purchaseData);

        const newPurchase = await Purchase.create(purchaseData);

        // stripe gateway initialize
        if (!process.env.STRIPE_SECRET_KEY) {
            console.error("Stripe secret key is missing");
            return res.json({success: false, message: "Payment configuration error"});
        }

        const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)
        const currency = (process.env.CURRENCY || 'usd').toLowerCase();
        
        // creating line items to for stripe
        const line_items = [{
            price_data:{
                currency,
                product_data:{
                    name: courseData.courseTitle
                },
                unit_amount: Math.floor(parseFloat(newPurchase.amount)) * 100
            },
            quantity: 1
        }]

        console.log("Creating Stripe session with:", {
            currency,
            amount: newPurchase.amount,
            courseTitle: courseData.courseTitle,
            line_items
        });

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-enrollments`,
            cancel_url: `${origin}/`,
            line_items: line_items,
            mode: 'payment',
            metadata: {
                purchaseId: newPurchase._id.toString()
            }
        })

        if (!session || !session.url) {
            console.error("Failed to create Stripe session");
            return res.json({success: false, message: "Failed to create payment session"});
        }

        console.log("Stripe session created successfully");
        res.json({success: true, session_url: session.url})

    } catch (error) {
        console.error("Error in purchaseCourse:", error);
        res.json({success: false, message: error.message})
    }
}

// Update user Course progress

export const updateUserCourseProgress = async(req,res)=>{
    try {
        const userId = req.auth.userId
        const {courseId, lectureId} = req.body
        const progressData = await CourseProgress.findOne({userId, courseId})

        if(progressData){
            if(progressData.lectureCompleted.includes(lectureId)){
                return res.json({success: true, message: "Lecture Already Completed"})
            }
            
            progressData.lectureCompleted.push(lectureId)
            progressData.completed = true
            await progressData.save()
        }
        else{
            await CourseProgress.create({
                userId,
                courseId,
                lectureCompleted: [lectureId]

            })
        }
        res.json({success:true, message: 'Progress Updated'})
    } catch (error) {
        res.json({success: false, message:error.message})
    }
}

// get user course progress

export const getUserCourseProgress = async(req,res)=>{
    try {
        const userId = req.auth.userId
        const {courseId} = req.body
        const progressData = await CourseProgress.findOne({userId, courseId})
        res.json({success: true, progressData})
    } catch (error) {
        res.json({success: false, message:error.message})
    }
}


// Add user ratings to course

export const addUserRating = async (req,res)=>{
    try {
        const userId = req.auth.userId
        const {courseId, rating} = req.body
        // console.log("UserId", courseId);
        // console.log("courseId", courseId);
        // console.log("rating", rating);
        

        if(!courseId || !userId || !rating || rating < 1 || rating > 5) {
    return res.json({success: false, message:"Invalid details"});
}

        const course = await Course.findById(courseId)
        if(!course){
            return res.json({success: false, message:"Course Not found!"})
        }

        const user = await User.findById(userId)

        if(!user || !user.enrolledCourses.includes(courseId)){
            return res.json({success: false, message:"User has not purchased this course."})
        }

        const existingRatingIndex = course.courseRatings.findIndex(r => r.userId === userId)
        if(existingRatingIndex > -1){
            course.courseRatings[existingRatingIndex].rating = rating;
        }
        else{
            course.courseRatings.push({userId,rating});
        }

        // await courseData.save()
        await course.save()
        res.json({success: true, message:"Rating Added"})

    } catch (error) {
        res.json({success: false, message: error.message});
    }
}