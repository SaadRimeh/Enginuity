import Post from "../models/post.model.js";

import cloudinary from "../config/cloudinary.js";


import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import Comment from "../models/comment.model.js";

import { getAuth } from "@clerk/express";
import { clerkClient } from "@clerk/express";

export const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);

  const user = await User.findOneAndUpdate({ clerkId: userId }, req.body, { new: true });

  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ user });
});

export const syncUser = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);

  const existingUser = await User.findOne({ clerkId: userId });
  if (existingUser) {
    return res.status(200).json({ user: existingUser, message: "User already exists" });
  }

  // create new user Clerk 
  const clerkUser = await clerkClient.users.getUser(userId);

  const userData = {
    clerkId: userId,
    email: clerkUser.emailAddresses[0].emailAddress,
    firstName: clerkUser.firstName ||"",
    lastName: clerkUser.lastName ||"",
    username: clerkUser.emailAddresses[0].emailAddress.split("@")[0],
    profilePicture: clerkUser.imageUrl || "",
  };

  const user = await User.create(userData);

  res.status(201).json({ user, message: "User created successfully" });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const user = await User.findOne({ clerkId: userId });

  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ user });
});

export const followUser = asyncHandler(async (req, res) => {
  const { userId } = req.auth();
  const { targetUserId } = req.params;

  if (userId === targetUserId) return res.status(400).json({ error: "You cannot follow yourself" });

  const currentUser = await User.findOne({ clerkId: userId });
  const targetUser = await User.findById(targetUserId);

  if (!currentUser || !targetUser) return res.status(404).json({ error: "User not found" });

  const isFollowing = currentUser.following.includes(targetUserId);

  if (isFollowing) {
    // unfollow
    await User.findByIdAndUpdate(currentUser._id, {
      $pull: { following: targetUserId },
    });
    await User.findByIdAndUpdate(targetUserId, {
      $pull: { followers: currentUser._id },
    });
  } else {
    // follow 
    await User.findByIdAndUpdate(currentUser._id, {
      $push: { following: targetUserId },
    });
    await User.findByIdAndUpdate(targetUserId, {
      $push: { followers: currentUser._id },
    });
    // create notification 
    await Notification.create({
      from: currentUser._id,
      to: targetUserId,
      type: "follow",
    });
  }

  res.status(200).json({
    message: isFollowing ? "User unfollowed successfully" : "User followed successfully",
  });
});

export const searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query || query.trim() === "") {
    return res.status(400).json({ error: "Query parameter is required" });
  }
  // Search by username, firstName, or lastName 
  const users = await User.find({
    $or: [
      { username: { $regex: query, $options: "i" } },
      { firstName: { $regex: query, $options: "i" } },
      { lastName: { $regex: query, $options: "i" } },
    ],
  }).select("_id username firstName lastName profilePicture");
  res.status(200).json({ users });
});
// Update only profilePicture
export const updateProfilePicture = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });
  if (!req.file) return res.status(400).json({ error: "No profile picture file uploaded" });
  const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  const uploadResponse = await cloudinary.uploader.upload(base64Image, {
    folder: "user_profile_pics",
    resource_type: "image",
    transformation: [
      { width: 400, height: 400, crop: "limit" },
      { quality: "auto" },
      { format: "auto" },
    ],
  });
  user.profilePicture = uploadResponse.secure_url;
  await user.save();
  res.status(200).json({ user });
});

// Update only bannerImage
export const updateBannerImage = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });
  if (!req.file) return res.status(400).json({ error: "No banner image file uploaded" });
  const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  const uploadResponse = await cloudinary.uploader.upload(base64Image, {
    folder: "user_banner_images",
    resource_type: "image",
    transformation: [
      { width: 1200, height: 400, crop: "limit" },
      { quality: "auto" },
      { format: "auto" },
    ],
  });
  user.bannerImage = uploadResponse.secure_url;
  await user.save();
  res.status(200).json({ user });
});
// Admin: delete a post
export const adminDeletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    // Only allow admin (add your admin check logic here)
    // Example: if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
    const post = await Post.findByIdAndDelete(postId);
    if (!post) return res.status(404).json({ error: "Post not found." });
    res.json({ message: "Post deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: ban (spam) a user for a set time
export const adminBanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { minutes, reason } = req.body;
    // Only allow admin (add your admin check logic here)
    // Example: if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
    if (!minutes || isNaN(minutes) || minutes < 1) {
      return res.status(400).json({ error: "Ban duration (minutes) required." });
    }
    const spamUntil = new Date(Date.now() + minutes * 60000);
    const user = await User.findByIdAndUpdate(userId, { spamUntil }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found." });
    // Create notification for user
    await Notification.create({
      user: user._id,
      type: "spam",
      message: `You have been banned for ${minutes} minutes.${reason ? " Reason: " + reason : ""}`,
    });
    res.json({ message: `User banned for ${minutes} minutes.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Dashboard summary for admin
export const getDashboard = async (req, res) => {
  try {
   
    const [userCount, postCount, commentCount, notificationCount, reportedPosts, usersList] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Comment.countDocuments(),
      Notification.countDocuments(),
      Post.find({ "reports.0": { $exists: true } })
        .populate("user", "username email")
        .populate("reports.user", "username email")
        .select("_id content type categories reports user createdAt")
        .sort({ createdAt: -1 })
        .limit(20),
      // Return a lightweight list of users (for admin overview)
      User.find({})
        .select("_id username firstName lastName email")
        .sort({ username: 1 })
        .limit(200)
    ]);

    // Map usersList to a small shape to avoid sending sensitive fields
    const users = (usersList || []).map(u => ({ _id: u._id, username: u.username, firstName: u.firstName, lastName: u.lastName, email: u.email }));

    // Build simple time series for last 30 days
    const days = 30;
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - (days - 1));
    start.setUTCHours(0,0,0,0);

    // Users by day
    const usersByDayAgg = await User.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Posts by day
    const postsByDayAgg = await Post.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Normalize to full 30-day series
    const usersByDay = [];
    const postsByDay = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      const key = d.toISOString().slice(0,10);
      const u = usersByDayAgg.find(x => x._id === key);
      const p = postsByDayAgg.find(x => x._id === key);
      usersByDay.push({ date: key, count: u ? u.count : 0 });
      postsByDay.push({ date: key, count: p ? p.count : 0 });
    }

    // Small AI-like analysis (simple heuristics)
    const totalUsers = userCount;
    const totalPosts = postCount;
    const avgPostsPerUser = totalUsers ? +(totalPosts / totalUsers).toFixed(2) : 0;
    const peakUserDay = usersByDay.reduce((a,b)=> b.count > a.count ? b : a, { date: null, count: 0 });
    const peakPostDay = postsByDay.reduce((a,b)=> b.count > a.count ? b : a, { date: null, count: 0 });

    const analysis = {
      avgPostsPerUser,
      peakUserDay,
      peakPostDay,
      note: 'Basic heuristics: avg posts/user, peak registration/post days.'
    };

    res.json({
      users: userCount,
      userList: users,
      posts: postCount,
      comments: commentCount,
      notifications: notificationCount,
      reportedPosts,
      usersByDay,
      postsByDay,
      analysis
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};