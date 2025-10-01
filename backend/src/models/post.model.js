
import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    sharedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      maxLength: 1000,
    },
    type: {
      type: String,
      enum: ["code", "general", "article", "fixing"],
      required: true,
    },
    categories: {
      type: [String],
      required: true,
      validate: {
        validator: function(arr) {
          return Array.isArray(arr) && arr.length > 0 && arr.every(cat => typeof cat === "string" && cat.trim() !== "");
        },
        message: "At least one non-empty category is required."
      }
    },
    reports: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: { type: String },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    price: {
      type: Number,
      default: null,
    },
    image: {
      type: String,
      default: "",
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    sharedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
