import { reportPost } from "../controllers/post.controller.js";


import express from "express";
import {
  createPost,
  deletePost,
  getPost,
  getPosts,
  getUserPosts,
  likePost,
  updatePostBody,
  sharePost,
  searchPostsByCategory,
  searchPostsByType,
} from "../controllers/post.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// public routes
router.get("/", getPosts); //dose
router.get("/:postId", getPost);//done
router.get("/user/:username", getUserPosts);//done
router.get("/search/category", searchPostsByCategory);//done 
router.get("/search/type", searchPostsByType);//done 



// protected proteced
router.post("/", protectRoute, upload.single("image"), createPost);//
router.post("/:postId/like", protectRoute, likePost);//done
router.delete("/:postId", protectRoute, deletePost);//
router.patch("/:postId/body", protectRoute, updatePostBody);//
router.post("/:postId/share", protectRoute, sharePost);//done

// Report a post
router.post("/:postId/report", protectRoute,reportPost);
export default router;
