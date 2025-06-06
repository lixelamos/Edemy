import mongoose from "mongoose";


// connect to mongoDb database

const connectDB = async ()=>{
    mongoose.connection.on('connected', ()=> console.log('Database connected successfully!')
    )
    await mongoose.connect(`${process.env.MONGODB_URI}/iCode`)

}
export default connectDB;