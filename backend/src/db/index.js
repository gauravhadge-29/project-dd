import mongoose from "mongoose";
import {DB_NAME} from "../constants.js"


const DB_CONNECT = async () => {
    try {
        const Connection = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`); // Connect to the database
        console.log(`Database connected to ${Connection.connection.host}`);
    } catch (error) {
        console.log(`MongoDB Connection Error: ${error.message}`);
        console.log(`PORT : ${process.env.PORT}`);
        console.log(`MONGODBURI : ${process.env.MONGODB_URI}`);
    }
}

export default DB_CONNECT

// var mongoose = require('mongoose');
// //Set up default mongoose connection
// var mongoDB = 'mongodb://127.0.0.1/my_database';
// mongoose.connect(mongoDB, { useNewUrlParser: true });
//  //Get the default connection
// var db = mongoose.connection;
// //Bind connection to error event (to get notification of connection errors)
// db.on('error', console.error.bind(console, 'MongoDB connection error:'));
// db.on('error', console.error.bind(console, 'MongoDB connection error:'));