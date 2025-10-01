import { v2 as cloudinary } from "cloudinary";
import { ENV } from "./env.js";
import dotenv from "dotenv";

dotenv.config();


  cloudinary.config({
  cloud_name:"ddxm3akvr" ,
  api_key:827411214515378,
  api_secret:"8r2-A51tsB_UjVhG9xTtb4zYRiw",
});
  
  


export default cloudinary;
