import Stripe from "stripe"
import Course from "../models/Course.js"
import { Purchase } from "../models/Purchase.js"
import User from "../models/User.js"
import { CourseProgress } from "../models/CourseProgress.js"

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
});

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

export const purchaseCourse = async (req, res) => {
    try {
        // Log the entire request object
        console.log("Full request object:", {
            body: req.body,
            headers: req.headers,
            auth: req.auth,
            params: req.params,
            query: req.query
        });

        // Ensure req.body exists and is an object
        if (!req.body || typeof req.body !== 'object') {
            console.error("Invalid request body:", req.body);
            return res.status(400).json({
                success: false,
                message: "Invalid request: missing or invalid body",
            });
        }

        // Ensure req.auth exists
        if (!req.auth || !req.auth.userId) {
            console.error("No auth in request");
            return res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
        }

        const { courseId, price, discount, currency: requestCurrency } = req.body;
        const { origin } = req.headers;
        const userId = req.auth.userId;

        console.log("Extracted values:", {
            courseId,
            price,
            discount,
            requestCurrency,
            origin,
            userId,
            currencyType: typeof requestCurrency
        });

        // Input validation
        if (!courseId || !origin || !userId) {
            console.error("Missing required fields:", { courseId, origin, userId });
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        // Find user and course
        const userData = await User.findById(userId);
        if (!userData) {
            console.error("User not found:", userId);
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const courseData = await Course.findById(courseId);
        if (!courseData) {
            console.error("Course not found:", courseId);
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        // Calculate final price
        const finalPrice = price || (courseData.coursePrice - (courseData.discount * courseData.coursePrice) / 100);
        
        // Create purchase record
        const purchaseData = {
            courseId: courseData._id,
            userId,
            amount: finalPrice.toFixed(2),
        };

        console.log("Creating purchase record:", purchaseData);
        const newPurchase = await Purchase.create(purchaseData);

        // Get currency from request or environment with fallback
        console.log("Currency values:", {
            requestCurrency,
            envCurrency: process.env.CURRENCY,
            defaultCurrency: 'usd'
        });

        // Ensure we have a valid currency string
        let currency = 'usd'; // Default value
        if (requestCurrency && typeof requestCurrency === 'string' && requestCurrency.trim()) {
            currency = requestCurrency.toLowerCase();
        } else if (process.env.CURRENCY && typeof process.env.CURRENCY === 'string' && process.env.CURRENCY.trim()) {
            currency = process.env.CURRENCY.toLowerCase();
        }
        
        // Validate currency code
        if (!['usd', 'eur', 'gbp', 'inr'].includes(currency)) {
            console.error("Invalid currency code:", currency);
            return res.status(400).json({
                success: false,
                message: "Invalid currency code",
            });
        }

        console.log("Using currency:", currency);

        // Validate Stripe key
        if (!process.env.STRIPE_SECRET_KEY) {
            console.error("Stripe secret key is not configured");
            return res.status(500).json({
                success: false,
                message: "Payment system is not configured",
            });
        }

        // Initialize Stripe
        const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2023-10-16'
        });

        // Create Stripe session
        const session = await stripeInstance.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [{
                price_data: {
                    currency: currency,
                    product_data: {
                        name: courseData.courseTitle,
                        description: courseData.courseDescription,
                        images: [courseData.courseThumbnail],
                    },
                    unit_amount: Math.round(finalPrice * 100), // Convert to cents
                },
                quantity: 1,
            }],
            mode: "payment",
            success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/cancel`,
            client_reference_id: courseId,
            customer_email: userData.email,
            metadata: {
                purchaseId: newPurchase._id.toString()
            }
        });

        console.log("Created Stripe session:", {
            sessionId: session.id,
            amount: finalPrice,
            currency: currency,
            courseTitle: courseData.courseTitle
        });

        res.status(200).json({
            success: true,
            session_url: session.url,
        });
    } catch (error) {
        console.error("Error in purchaseCourse:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({
            success: false,
            message: error.message || "Error processing payment",
        });
    }
};

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