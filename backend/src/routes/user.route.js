import { adminDeletePost, adminBanUser } from "../controllers/user.controller.js";
// import { authMiddleware } from "../middleware/auth.middleware.js";
import { getDashboard } from "../controllers/user.controller.js";
import upload from "../middleware/upload.middleware.js";

import express from "express";
import {
  followUser,
  getCurrentUser,
  getUserProfile,
  syncUser,
  updateProfile,
  searchUsers,
  updateProfilePicture,
  updateBannerImage,
} from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// public route
router.get("/profile/:username", getUserProfile);
router.get("/search", searchUsers);

// protected routes
router.post("/sync", protectRoute, syncUser);
router.get("/me", protectRoute, getCurrentUser);
router.put("/profile", protectRoute, updateProfile);
router.post("/follow/:targetUserId", protectRoute, followUser);


// Update profile picture and banner image
router.put("/profile/profilePicture", protectRoute, upload.single("profilePicture"), updateProfilePicture);
router.put("/profile/bannerImage", protectRoute, upload.single("bannerImage"), updateBannerImage);
// Admin: delete post
router.delete("/admin/posts/:postId", adminDeletePost);
router.get("/dashboard",  getDashboard);
router.post("/admin/users/:userId/ban", adminBanUser);


export default router;
