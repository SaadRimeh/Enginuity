## Report a Post

**POST /api/posts/:postId/report**

Body:
```
{
  "reason": "Spam or inappropriate content"
}
```
Response:
```
{
  "message": "Post reported."
}
```

---

## Dashboard (Admin)

**GET /api/dashboard**

Response:
```
{
  "users": 123,
  "posts": 456,
  "comments": 789,
  "notifications": 10,
  "reportedPosts": [
    {
      "_id": "...",
      "content": "...",
      "type": "...",
      "categories": ["..."],
      "reports": [
        { "user": { "_id": "...", "username": "..." }, "reason": "Spam", "createdAt": "..." }
      ],
      "user": { "_id": "...", "username": "..." },
      "createdAt": "..."
    }
  ]
}
```

---

## Admin: Delete Post

**DELETE /api/admin/posts/:postId**

Response:
```
{
  "message": "Post deleted."
}
```

---

## Admin: Ban (Spam) User

**POST /api/admin/users/:userId/ban**

Body:
```
{
  "minutes": 60,
  "reason": "Spamming posts"
}
```
Response:
```
{
  "message": "User banned for 60 minutes."
}
```

---
### Update Profile Picture
**PUT /api/users/profile/profilePicture**
- Headers:
  - Authorization: Bearer <token>
  - Content-Type: multipart/form-data
- Body (form-data):
  - profilePicture: File (required)
- Response:
```json
{
  "user": {
    "_id": "66f1...",
    "profilePicture": "https://.../avatar.jpg"
    // ...other user fields
  }
}
```

### Update Banner Image
**PUT /api/users/profile/bannerImage**
- Headers:
  - Authorization: Bearer <token>
  - Content-Type: multipart/form-data
- Body (form-data):
  - bannerImage: File (required)
- Response:
```json
{
  "user": {
    "_id": "66f1...",
    "bannerImage": "https://.../banner.jpg"
    // ...other user fields
  }
}
```
# API Endpoints Documentation

## Users

### Create/Sync User
**POST /api/users/sync**
- Headers:
  - Authorization: Bearer <token>
  - Content-Type: application/json
- Body:
```json
{}
```
- Response:
```json
{
  "message": "User synced",
  "user": { "_id": "66f1...", "username": "jane_doe" }
}
```

### Get User Profile
**GET /api/users/profile/:username**
- Public
- Response:
```json
{
  "user": {
    "_id": "66f1...",
    "username": "jane_doe",
    "name": "Jane Doe",
    "bio": "Hello 👋",
    "avatarUrl": "https://.../avatar.jpg",
    "followersCount": 12,
    "followingCount": 8
  }
}
```

### Search Users
**GET /api/users/search?q=<query>**
- Public
- Response:
```json
{
  "results": [
    { "_id": "66f1...", "username": "jane_doe", "name": "Jane Doe", "avatarUrl": "https://..." }
  ]
}
```

### Get Current User
**GET /api/users/me**
- Headers:
  - Authorization: Bearer <token>
- Response:
```json
{
  "user": {
    "_id": "66f1...",
    "username": "jane_doe",
    "email": "jane@example.com",
    "name": "Jane Doe",
    "avatarUrl": "https://..."
  }
}
```

### Update Profile
**PUT /api/users/profile**
- Headers:
  - Authorization: Bearer <token>
  - Content-Type: application/json
- Body (any combination of these fields):
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "username": "jane_doe",
  
  "bio": "Hello 👋",
  "location": "New York"
}
```
- Response:
```json
{
  "user": {
    "_id": "66f1...",
    "firstName": "Jane",
    "lastName": "Doe",
    "username": "jane_doe",
    "profilePicture": "https://.../avatar.jpg",
    "bannerImage": "https://.../banner.jpg",
    "bio": "Hello 👋",
    "location": "New York"
  }
}
```

### Follow User
**POST /api/users/follow/:targetUserId**
- Headers:
  - Authorization: Bearer <token>
- Response:
```json
{ "followed": true, "targetUserId": "66a2..." }
```

---

## Posts

### Create Post
**POST /api/posts**
- Headers:
  - Authorization: Bearer <token>
  - Content-Type: multipart/form-data
- Body (form-data):
  - content: Text (optional)
  - type: Text (required, one of: code, general, article, fixing)
  - categories: Text (required, comma-separated list, e.g. "tech,news,science")
  - price: Number (optional)
  - image: File (optional)
- Response:
```json
{
  "post": {
    "_id": "701a...",
    "content": "This is the main text of my post.",
  "type": "code",
  "categories": ["tech", "news", "science"],
  "price": 10,
  "image": "https://...",
  "user": "...",
  "sharedFrom": null,
    ...
  }
}
```

### Get All Posts
**GET /api/posts**
- Public
- Response:
```json
{
  "posts": [ ... ]
}
```

### Get Post by ID
**GET /api/posts/:postId**
- Public
- Response:
```json
{
  "post": { ... }
}
```

### Get Posts by User
**GET /api/posts/user/:username**
- Public
- Response:
```json
{
  "posts": [ ... ]
}
```

### Like Post
**POST /api/posts/:postId/like**
- Headers:
  - Authorization: Bearer <token>
- Response:
```json
{ "message": "Post liked successfully" }
```

### Delete Post
**DELETE /api/posts/:postId**
- Headers:
  - Authorization: Bearer <token>
- Response:
```json
{ "message": "Post deleted successfully" }
```

### Update Post Body
**PATCH /api/posts/:postId/body**
- Headers:
  - Authorization: Bearer <token>
  - Content-Type: application/json
- Body:
```json
{ "content": "Updated content" }
```
- Response:
```json
{ "post": { ... } }
```

### Share Post
**POST /api/posts/:postId/share**
- Headers:
  - Authorization: Bearer <token>
- Response:
```json
{
  "post": {
    "_id": "702b...",
    "content": "This is the main text of my post.",
    "type": "code",
    "category": "technology",
    "price": 10,
    "image": "https://...",
    "user": "...",
    "sharedFrom": "701a..."
  },
  "message": "Post shared successfully"
}
```

### Search Posts by Category
**GET /api/posts/search/category?category=tech,news,science**
- Query Parameters:
  - category: One or more category names, comma-separated (e.g., `tech,news,science`)
- Response:
```json
{
  "posts": [ ... ]
}
```

### Search Posts by Type
**GET /api/posts/search/type?type=code**
- Query Parameters:
  - type: code, general, article, fixing
- Response:
```json
{
  "posts": [ ... ]
}
```

---

## Comments

### Get Comments for Post
**GET /api/comments/post/:postId**
- Public
- Response:
```json
{
  "comments": [ ... ]
}
```

### Create Comment
**POST /api/comments/post/:postId**
- Headers:
  - Authorization: Bearer <token>
  - Content-Type: application/json
- Body:
```json
{ "text": "Nice post!" }
```
- Response:
```json
{
  "comment": { ... }
}
```

### Delete Comment
**DELETE /api/comments/:commentId**
- Headers:
  - Authorization: Bearer <token>
- Response:
```json
{ "deleted": true, "commentId": "88c1..." }
```

---

## Notifications

### Get Notifications
**GET /api/notifications**
- Headers:
  - Authorization: Bearer <token>
- Response:
```json
{
  "notifications": [ ... ]
}
```

### Delete Notification
**DELETE /api/notifications/:notificationId**
- Headers:
  - Authorization: Bearer <token>
- Response:
```json
{ "deleted": true, "notificationId": "90ab..." }
```
