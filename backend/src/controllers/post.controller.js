


import asyncHandler from "express-async-handler";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { getAuth } from "@clerk/express";
import cloudinary from "../config/cloudinary.js";

import Notification from "../models/notification.model.js";
import Comment from "../models/comment.model.js";

export const getPosts = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  let followingIds = [];
  if (userId) {
    const user = await User.findOne({ clerkId: userId });
    if (user && user.following && user.following.length > 0) {
      followingIds = user.following;
    }
  }

  // Get posts from followed users
  const followingPosts = await Post.find({ user: { $in: followingIds } })
    .populate("user", "username firstName lastName profilePicture")
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "username firstName lastName profilePicture",
      },
    });

  // Get most popular posts (by likes), excluding already selected posts
  const excludeIds = followingPosts.map(p => p._id);
  const popularPosts = await Post.find({ _id: { $nin: excludeIds } })
    .sort({ likes: -1 })
    .limit(Math.max(Math.floor(followingPosts.length * 3 / 7), 10)) // fallback to 10 if few following posts
    .populate("user", "username firstName lastName profilePicture")
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "username firstName lastName profilePicture",
      },
    });

  // Blend: 70% following, 30% popular
  const totalCount = followingPosts.length + popularPosts.length;
  const numFollowing = Math.floor(totalCount * 0);
  const numPopular = totalCount - numFollowing;
  const selectedFollowing = followingPosts.slice(0, numFollowing);
  const selectedPopular = popularPosts.slice(0, numPopular);
  const blended = [...selectedFollowing, ...selectedPopular];

  // Shuffle/interleave
  for (let i = blended.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [blended[i], blended[j]] = [blended[j], blended[i]];
  }

  res.status(200).json({ posts: blended });
});

export const getPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId)
    .populate("user", "username firstName lastName profilePicture")
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "username firstName lastName profilePicture",
      },
    });

  if (!post) return res.status(404).json({ error: "Post not found" });

  res.status(200).json({ post });
});

export const getUserPosts = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ error: "User not found" });

  const posts = await Post.find({ user: user._id })
    .sort({ createdAt: -1 })
    .populate("user", "username firstName lastName profilePicture")
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "username firstName lastName profilePicture",
      },
    });

  res.status(200).json({ posts });
});

export const createPost = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { content, type, price, categories } = req.body;
  const imageFile = req.file;

  if (!content && !imageFile) {
    return res.status(400).json({ error: "Post must contain either text or image" });
  }
  if (!type || !["code", "general", "article", "fixing"].includes(type)) {
    return res.status(400).json({ error: "Post type is required and must be one of: code, general, article, fixing" });
  }
  if (!Array.isArray(categories) || categories.length === 0 || !categories.every(cat => typeof cat === "string" && cat.trim() !== "")) {
    return res.status(400).json({ error: "At least one non-empty category is required (array of strings)." });
  }

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  let imageUrl = "";

  // upload image to Cloudinary if provided
  if (imageFile) {
    try {
      // convert buffer to base64 for cloudinary
      const base64Image = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString(
        "base64"
      )}`;

      const uploadResponse = await cloudinary.uploader.upload(base64Image, {
        folder: "social_media_posts",
        resource_type: "image",
        transformation: [
          { width: 800, height: 600, crop: "limit" },
          { quality: "auto" },
          { format: "auto" },
        ],
      });
      imageUrl = uploadResponse.secure_url;
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      return res.status(400).json({ error: "Failed to upload image" });
    }
  }

  const post = await Post.create({
    user: user._id,
    content: content || "",
    type,
    categories,
    price: price !== undefined && price !== null && price !== '' ? Number(price) : undefined,
    image: imageUrl,
  });

  res.status(201).json({ post });
});

// Search posts by category
export const searchPostsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.query;
  if (!category || typeof category !== "string" || category.trim() === "") {
    return res.status(400).json({ error: "Category is required and must be a non-empty string" });
  }
  // Support comma-separated categories
  const categoryList = category.split(",").map(cat => cat.trim()).filter(cat => cat !== "");
  if (categoryList.length === 0) {
    return res.status(400).json({ error: "At least one valid category is required." });
  }
  const posts = await Post.find({ categories: { $in: categoryList } })
    .populate("user", "username firstName lastName profilePicture")
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "username firstName lastName profilePicture",
      },
    });
  res.status(200).json({ posts });
});

export const likePost = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;

  const user = await User.findOne({ clerkId: userId });
  const post = await Post.findById(postId);

  if (!user || !post) return res.status(404).json({ error: "User or post not found" });

  const isLiked = post.likes.includes(user._id);

  if (isLiked) {
    // unlike
    await Post.findByIdAndUpdate(postId, {
      $pull: { likes: user._id },
    });
  } else {
    // like
    await Post.findByIdAndUpdate(postId, {
      $push: { likes: user._id },
    });

    // create notification if not liking own post
    if (post.user.toString() !== user._id.toString()) {
      await Notification.create({
        from: user._id,
        to: post.user,
        type: "like",
        post: postId,
      });
    }
  }

  res.status(200).json({
    message: isLiked ? "Post unlike successfully" : "Post liked successfully",
  });
});

export const deletePost = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;

  const user = await User.findOne({ clerkId: userId });
  const post = await Post.findById(postId);

  if (!user || !post) return res.status(404).json({ error: "User or post not found" });

  if (post.user.toString() !== user._id.toString()) {
    return res.status(403).json({ error: "You can only delete your own posts" });
  }

  // delete all comments on this post
  await Comment.deleteMany({ post: postId });

  // delete the post
  await Post.findByIdAndDelete(postId);

  res.status(200).json({ message: "Post deleted successfully" });
});

export const updatePostBody = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Content is required" });
  }

  const user = await User.findOne({ clerkId: userId });
  const post = await Post.findById(postId);

  if (!user || !post) return res.status(404).json({ error: "User or post not found" });

  if (post.user.toString() !== user._id.toString()) {
    return res.status(403).json({ error: "You can only update your own posts" });
  }

  post.content = content;
  await post.save();

  res.status(200).json({ post });
});

export const sharePost = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const originalPost = await Post.findById(postId);
  if (!originalPost) return res.status(404).json({ error: "Original post not found" });

  if (originalPost.user.toString() === user._id.toString()) {
    return res.status(403).json({ error: "You cannot share your own post" });
  }

  const sharedPost = await Post.create({
    user: user._id,
    content: originalPost.content,
    type: originalPost.type,
    category: originalPost.category,
    price: originalPost.price,
    image: originalPost.image,
    sharedFrom: originalPost._id,
  });

  res.status(201).json({ post: sharedPost, message: "Post shared successfully" });
});

// Search posts by type
export const searchPostsByType = asyncHandler(async (req, res) => {
  const { type } = req.query;
  if (!type || !["code", "general", "article", "fixing"].includes(type)) {
    return res.status(400).json({ error: "Type is required and must be a valid value" });
  }
  const posts = await Post.find({ type })
    .populate("user", "username firstName lastName profilePicture")
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "username firstName lastName profilePicture",
      },
    });
  res.status(200).json({ posts });
});
// Report a post
export const reportPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason } = req.body;
    const userId = req.auth?.userId || req.user?._id ;
    if (!reason || !userId) {
      return res.status(400).json({ error: "Reason and user required." });
    }
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }
    // Prevent duplicate report by same user
    if (post.reports.some(r => r.user.toString() === userId.toString())) {
      return res.status(400).json({ error: "You already reported this post." });
    }
    post.reports.push({ user: userId, reason });
    await post.save();
    res.json({ message: "Post reported." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};