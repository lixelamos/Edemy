import { clerkClient } from "@clerk/express";

// Middleware (protect educator route)

 export const protectEducator = async(req, res, next) => {
    try {
        const userId = req.auth?.userId
        
        if (!userId) {
            return res.status(401).json({
                success: false, 
                message: "Authentication required. Please login."
            })
        }

        const user = await clerkClient.users.getUser(userId)
        
        if (!user) {
            return res.status(401).json({
                success: false, 
                message: "Invalid user. Please login again."
            })
        }

        if (user.publicMetadata?.role !== 'educator') {
            return res.status(403).json({
                success: false, 
                message: "Access denied. Educator role required."
            })
        }
        
        // Attach user to request for downstream use
        req.user = user
        next()

    } catch (error) {
        console.error("Educator protection middleware error:", error)
        
        if (error.status === 404) {
            return res.status(401).json({
                success: false, 
                message: "User not found. Please login again."
            })
        }
        
        return res.status(500).json({
            success: false, 
            message: "Authentication service error"
        })
    }
}