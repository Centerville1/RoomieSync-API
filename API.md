# RoomieSync API Documentation

## Base URL
```
http://localhost:3001
```

## Interactive Documentation
📚 **Swagger UI**: http://localhost:3001/api

## API Overview

### Available Endpoints

| Category | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| **Health** | GET | `/` | Welcome message |
| **Health** | GET | `/health` | Health check |
| **Authentication** | POST | `/auth/register` | Register new user |
| **Authentication** | POST | `/auth/login` | Login user |
| **Authentication** | GET | `/auth/profile` | Get user profile |
| **Authentication** | PATCH | `/auth/profile` | Update user profile |
| **Authentication** | POST | `/auth/upload-profile-image` | Upload profile image |
| **Houses** | POST | `/houses` | Create house |
| **Houses** | POST | `/houses/join` | Join house |
| **Houses** | GET | `/houses` | Get user houses |
| **Houses** | GET | `/houses/{id}` | Get house details |
| **Houses** | PATCH | `/houses/{id}` | Update house details |
| **Houses** | POST | `/houses/{id}/upload-image` | Upload house image |
| **Expenses** | POST | `/houses/{houseId}/expenses` | Create expense |
| **Expenses** | GET | `/houses/{houseId}/expenses` | Get house expenses |
| **Expenses** | GET | `/houses/{houseId}/expenses/{expenseId}` | Get expense details |
| **Balances** | GET | `/houses/{houseId}/balances` | Get house balances |
| **Payments** | POST | `/houses/{houseId}/payments` | Create payment |
| **Payments** | GET | `/houses/{houseId}/payments` | Get house payments |

### Key Features

- **🔐 JWT Authentication** - Secure user authentication and authorization
- **🏠 Multi-House Support** - Users can belong to multiple houses
- **💰 Expense Tracking** - Create and track shared expenses with automatic splitting
- **⚖️ Balance Management** - Automatic calculation of who owes what to whom
- **💸 Payment Recording** - Record payments between house members with balance updates
- **📊 Categorization** - Organize expenses by categories
- **🎨 Customization** - User profile images/colors and house images/colors with Cloudinary integration
- **📸 Image Upload** - Secure image uploads with automatic optimization and CDN delivery
- **📋 Comprehensive API** - Full CRUD operations with detailed error handling

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### 🔐 Register User
**POST** `/auth/register`

Create a new user account and optionally join a house.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",     // Optional
  "inviteCode": "HOUSE123",         // Optional - join house during registration
  "displayName": "Johnny"           // Required if using inviteCode
}
```

**Responses:**
- **201 Created**: User successfully registered
- **400 Bad Request**: Invalid input data
- **409 Conflict**: Email or display name already exists

**Success Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "houseMemberships": []
  }
}
```

### 🔑 Login User
**POST** `/auth/login`

Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Responses:**
- **200 OK**: User successfully authenticated
- **401 Unauthorized**: Invalid credentials

**Success Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "houseMemberships": [{
      "id": "uuid",
      "displayName": "Johnny",
      "role": "member",
      "house": {
        "id": "uuid",
        "name": "My House",
        "inviteCode": "HOUSE123"
      }
    }]
  }
}
```

### 👤 Get User Profile
**GET** `/auth/profile`

**Headers:** `Authorization: Bearer <token>`

Retrieve the authenticated user's profile information.

**Responses:**
- **200 OK**: User profile data
- **401 Unauthorized**: Invalid or missing JWT token

**Success Response:**
```json
{
  "id": "uuid",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

### 🎨 Update User Profile
**PATCH** `/auth/profile`

**Headers:** `Authorization: Bearer <token>`

Update user profile information including name, phone, profile image, and color.

**Request Body:**
```json
{
  "firstName": "John",                              // Optional
  "lastName": "Doe",                                // Optional
  "phoneNumber": "+1234567890",                     // Optional
  "profileImageUrl": "https://example.com/profile.jpg", // Optional
  "color": "#FF5733"                                // Optional hex color
}
```

**Responses:**
- **200 OK**: Profile updated successfully
- **400 Bad Request**: Invalid input data or invalid URL/color format
- **401 Unauthorized**: Invalid or missing JWT token

**Success Response:**
```json
{
  "id": "uuid",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "profileImageUrl": "https://example.com/profile.jpg",
  "color": "#FF5733",
  "createdAt": "2025-09-06T12:00:00Z",
  "updatedAt": "2025-09-07T14:00:00Z"
}
```

### 📸 Upload Profile Image
**POST** `/auth/upload-profile-image`

**Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`

Upload a profile image and automatically update the user's profileImageUrl. Images are uploaded to Cloudinary with automatic optimization.

**Supported formats:** JPEG, PNG, GIF, WebP  
**Maximum file size:** 5MB  
**Automatic optimization:** Yes (quality, format, resizing)  

**Form Data:**
- `image` (file): The image file to upload

**Responses:**
- **201 Created**: Image uploaded successfully
- **400 Bad Request**: Invalid file format, file too large, or upload failed
- **401 Unauthorized**: Invalid or missing JWT token

**Success Response:**
```json
{
  "id": "uuid",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "profileImageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/roomiesync/profiles/abc123.jpg",
  "color": "#6366F1",
  "createdAt": "2025-09-06T12:00:00Z",
  "updatedAt": "2025-09-07T14:00:00Z"
}
```

---

## House Management Endpoints

### 🏠 Create House
**POST** `/houses`

**Headers:** `Authorization: Bearer <token>`

Create a new house and become its admin. Generates a unique invite code.

**Request Body:**
```json
{
  "name": "My Shared House",
  "address": "123 Main St, City, State",    // Optional
  "description": "A cozy 3-bedroom house", // Optional
  "displayName": "Johnny"                   // Your display name in this house
}
```

**Responses:**
- **201 Created**: House successfully created
- **400 Bad Request**: Invalid input data
- **409 Conflict**: Display name already taken

**Success Response:**
```json
{
  "id": "uuid",
  "name": "My Shared House",
  "address": "123 Main St",
  "description": "A cozy house",
  "inviteCode": "HOUSE123",
  "isActive": true,
  "createdAt": "2025-09-06T12:00:00Z",
  "updatedAt": "2025-09-06T12:00:00Z",
  "memberships": [{
    "id": "uuid",
    "displayName": "Johnny",
    "role": "admin",
    "joinedAt": "2025-09-06T12:00:00Z",
    "user": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    }
  }]
}
```

### 🚪 Join House
**POST** `/houses/join`

**Headers:** `Authorization: Bearer <token>`

Join an existing house using its invite code.

**Request Body:**
```json
{
  "inviteCode": "HOUSE123",
  "displayName": "Johnny"  // Your display name in this house (unique per house)
}
```

**Responses:**
- **201 Created**: Successfully joined house
- **404 Not Found**: House not found or inactive
- **409 Conflict**: Already a member or display name taken

**Success Response:**
```json
{
  "id": "uuid",
  "name": "My Shared House",
  "address": "123 Main St",
  "description": "A cozy house",
  "inviteCode": "HOUSE123",
  "createdAt": "2025-09-06T12:00:00Z",
  "userMembership": {
    "id": "uuid",
    "displayName": "Johnny",
    "role": "member",
    "joinedAt": "2025-09-06T12:00:00Z"
  },
  "members": [{
    "id": "uuid",
    "displayName": "Admin User",
    "role": "admin",
    "joinedAt": "2025-09-05T10:00:00Z",
    "user": {
      "id": "uuid",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com"
    }
  }]
}
```

### 📋 Get User Houses
**GET** `/houses`

**Headers:** `Authorization: Bearer <token>`

Get all houses the authenticated user belongs to.

**Responses:**
- **200 OK**: List of houses user belongs to

**Success Response:**
```json
[{
  "id": "uuid",
  "name": "My Shared House",
  "address": "123 Main St",
  "description": "A cozy house",
  "inviteCode": "HOUSE123",
  "createdAt": "2025-09-06T12:00:00Z",
  "membership": {
    "id": "uuid",
    "displayName": "Johnny",
    "role": "admin",
    "joinedAt": "2025-09-06T12:00:00Z"
  }
}]
```

### 🏡 Get House Details
**GET** `/houses/{id}`

**Headers:** `Authorization: Bearer <token>`

Get detailed information about a specific house including all members.

**Parameters:**
- `id` (path): House UUID

**Responses:**
- **200 OK**: House details with members
- **404 Not Found**: House not found or user is not a member

**Success Response:**
```json
{
  "id": "uuid",
  "name": "My Shared House",
  "address": "123 Main St",
  "description": "A cozy house",
  "inviteCode": "HOUSE123",
  "createdAt": "2025-09-06T12:00:00Z",
  "userMembership": {
    "id": "uuid",
    "displayName": "Johnny",
    "role": "admin",
    "joinedAt": "2025-09-06T12:00:00Z"
  },
  "members": [{
    "id": "uuid",
    "displayName": "Johnny",
    "role": "admin",
    "joinedAt": "2025-09-06T12:00:00Z",
    "user": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    }
  }]
}
```

### 🎨 Update House Details
**PATCH** `/houses/{id}`

**Headers:** `Authorization: Bearer <token>`

Update house information including name, address, description, image, and color. Only admins can update house details.

**Parameters:**
- `id` (path): House UUID

**Request Body:**
```json
{
  "name": "Updated House Name",                     // Optional
  "address": "456 New Address St, City, State",    // Optional
  "description": "Updated house description",       // Optional
  "imageUrl": "https://example.com/house.jpg",      // Optional
  "color": "#10B981"                               // Optional hex color
}
```

**Responses:**
- **200 OK**: House updated successfully
- **400 Bad Request**: Invalid input data or invalid URL/color format
- **401 Unauthorized**: Invalid or missing JWT token
- **403 Forbidden**: Only admins can update house details
- **404 Not Found**: House not found or user is not a member

**Success Response:**
```json
{
  "id": "uuid",
  "name": "Updated House Name",
  "address": "456 New Address St",
  "description": "Updated house description",
  "inviteCode": "HOUSE123",
  "imageUrl": "https://example.com/house.jpg",
  "color": "#10B981",
  "createdAt": "2025-09-06T12:00:00Z",
  "updatedAt": "2025-09-07T14:00:00Z"
}
```

### 📸 Upload House Image
**POST** `/houses/{id}/upload-image`

**Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`

Upload a house image and automatically update the house's imageUrl. Only house admins can upload images. Images are uploaded to Cloudinary with automatic optimization.

**Parameters:**
- `id` (path): House UUID

**Supported formats:** JPEG, PNG, GIF, WebP  
**Maximum file size:** 10MB  
**Automatic optimization:** Yes (quality, format, resizing to 1200x800)  

**Form Data:**
- `image` (file): The image file to upload

**Responses:**
- **201 Created**: Image uploaded successfully
- **400 Bad Request**: Invalid file format, file too large, or upload failed
- **401 Unauthorized**: Invalid or missing JWT token
- **403 Forbidden**: Only admins can upload house images
- **404 Not Found**: House not found or user is not a member

**Success Response:**
```json
{
  "id": "uuid",
  "name": "My House",
  "address": "123 Main St",
  "description": "A cozy house",
  "inviteCode": "HOUSE123",
  "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/roomiesync/houses/def456.jpg",
  "color": "#10B981",
  "createdAt": "2025-09-06T12:00:00Z",
  "updatedAt": "2025-09-07T14:00:00Z"
}
```

---

## Expense Management Endpoints

### 💳 Create Expense
**POST** `/houses/{houseId}/expenses`

**Headers:** `Authorization: Bearer <token>`

Create a new expense and automatically update balances between house members.

**Parameters:**
- `houseId` (path): House UUID

**Request Body:**
```json
{
  "description": "Weekly grocery shopping",
  "amount": 125.50,
  "expenseDate": "2025-09-06",
  "receiptUrl": "https://example.com/receipt.jpg",  // Optional
  "splitBetween": ["user-uuid-1", "user-uuid-2"],
  "categoryId": "category-uuid"
}
```

**Responses:**
- **201 Created**: Expense created successfully
- **400 Bad Request**: Invalid input data, category not found, or users not members of house

**Success Response:**
```json
{
  "id": "uuid",
  "description": "Weekly grocery shopping",
  "amount": 125.50,
  "expenseDate": "2025-09-06",
  "receiptUrl": "https://example.com/receipt.jpg",
  "splitBetween": ["user-uuid-1", "user-uuid-2"],
  "createdAt": "2025-09-06T12:00:00Z",
  "updatedAt": "2025-09-06T12:00:00Z",
  "paidBy": {
    "id": "user-uuid-1",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "category": {
    "id": "category-uuid",
    "name": "Groceries",
    "color": "#10B981"
  }
}
```

### 📊 Get House Expenses
**GET** `/houses/{houseId}/expenses`

**Headers:** `Authorization: Bearer <token>`

Get all expenses for the house, ordered by date (most recent first).

**Parameters:**
- `houseId` (path): House UUID

**Responses:**
- **200 OK**: List of house expenses
- **404 Not Found**: House not found or user is not a member

**Success Response:**
```json
[{
  "id": "uuid",
  "description": "Weekly grocery shopping",
  "amount": 125.50,
  "expenseDate": "2025-09-06",
  "receiptUrl": "https://example.com/receipt.jpg",
  "splitBetween": ["user-uuid-1", "user-uuid-2"],
  "createdAt": "2025-09-06T12:00:00Z",
  "updatedAt": "2025-09-06T12:00:00Z",
  "paidBy": {
    "id": "user-uuid-1",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "category": {
    "id": "category-uuid",
    "name": "Groceries",
    "color": "#10B981"
  }
}]
```

### 🔍 Get Expense Details
**GET** `/houses/{houseId}/expenses/{expenseId}`

**Headers:** `Authorization: Bearer <token>`

Get detailed information about a specific expense.

**Parameters:**
- `houseId` (path): House UUID
- `expenseId` (path): Expense UUID

**Responses:**
- **200 OK**: Expense details
- **404 Not Found**: Expense not found or user is not a member

---

## Balance Management Endpoints

### 💰 Get House Balances
**GET** `/houses/{houseId}/balances`

**Headers:** `Authorization: Bearer <token>`

Get current IOU balances between house members.

**Parameters:**
- `houseId` (path): House UUID

**Responses:**
- **200 OK**: List of current balances
- **404 Not Found**: House not found or user is not a member

**Success Response:**
```json
[{
  "id": "balance-uuid",
  "amount": 62.75,
  "updatedAt": "2025-09-06T12:00:00Z",
  "fromUser": {
    "id": "user-uuid-1",
    "firstName": "Alice",
    "lastName": "Smith",
    "email": "alice@example.com"
  },
  "toUser": {
    "id": "user-uuid-2",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  }
}]
```

---

## Payment Management Endpoints

### 💸 Create Payment
**POST** `/houses/{houseId}/payments`

**Headers:** `Authorization: Bearer <token>`

Record a payment between house members and automatically update balances.

**Parameters:**
- `houseId` (path): House UUID

**Request Body:**
```json
{
  "amount": 125.50,
  "toUserId": "user-uuid-2",
  "memo": "Groceries repayment",        // Optional
  "paymentDate": "2025-09-06"
}
```

**Responses:**
- **201 Created**: Payment created successfully
- **400 Bad Request**: Invalid input data, users not members of house, or attempting to pay yourself
- **404 Not Found**: House not found or user is not a member

**Success Response:**
```json
{
  "id": "payment-uuid",
  "amount": 125.50,
  "memo": "Groceries repayment",
  "paymentDate": "2025-09-06",
  "createdAt": "2025-09-06T12:00:00Z",
  "updatedAt": "2025-09-06T12:00:00Z",
  "fromUser": {
    "id": "user-uuid-1",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "toUser": {
    "id": "user-uuid-2",
    "firstName": "Alice",
    "lastName": "Smith",
    "email": "alice@example.com"
  }
}
```

### 💳 Get House Payments
**GET** `/houses/{houseId}/payments`

**Headers:** `Authorization: Bearer <token>`

Get all payments in the house or just payments involving the authenticated user.

**Parameters:**
- `houseId` (path): House UUID
- `userOnly` (query, optional): If true, only return payments involving the authenticated user

**Responses:**
- **200 OK**: List of payments
- **404 Not Found**: House not found or user is not a member

**Success Response:**
```json
[{
  "id": "payment-uuid",
  "amount": 125.50,
  "memo": "Groceries repayment",
  "paymentDate": "2025-09-06",
  "createdAt": "2025-09-06T12:00:00Z",
  "updatedAt": "2025-09-06T12:00:00Z",
  "fromUser": {
    "id": "user-uuid-1",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "toUser": {
    "id": "user-uuid-2",
    "firstName": "Alice",
    "lastName": "Smith",
    "email": "alice@example.com"
  }
}]
```

---

## Health Endpoints

### ❤️ Health Check
**GET** `/health`

Check if the service is running properly.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-09-06T06:15:45.000Z",
  "service": "RoomieSync API"
}
```

### 👋 Welcome Message
**GET** `/`

Get a welcome message from the API.

**Response:**
```
Welcome to RoomieSync API! 🏠
```

---

## Data Models

### User
```typescript
{
  id: string;           // UUID
  email: string;        // Unique email
  firstName: string;    // User's first name
  lastName: string;     // User's last name
  phoneNumber?: string; // Optional phone number
  profileImageUrl?: string; // Optional profile image URL
  color: string;        // User color (default: #6366F1)
  isActive: boolean;    // Account status
  createdAt: Date;      // Account creation date
  updatedAt: Date;      // Last update date
  houseMemberships: HouseMembership[]; // Houses user belongs to
}
```

### House
```typescript
{
  id: string;           // UUID
  name: string;         // House name
  address?: string;     // Optional house address
  description?: string; // Optional description
  inviteCode: string;   // Unique invite code
  imageUrl?: string;    // Optional house image URL
  color: string;        // House color (default: #10B981)
  isActive: boolean;    // House status
  createdAt: Date;      // Creation date
  updatedAt: Date;      // Last update date
  memberships: HouseMembership[]; // House members
}
```

### HouseMembership
```typescript
{
  id: string;           // UUID
  displayName: string;  // User's name in this house (unique per house)
  role: 'admin' | 'member'; // User role in this house
  isActive: boolean;    // Membership status
  joinedAt: Date;       // When user joined house
  updatedAt: Date;      // Last update date
  user: User;           // User reference
  house: House;         // House reference
}
```

### Expense
```typescript
{
  id: string;           // UUID
  description: string;  // What was purchased
  amount: number;       // Total amount (decimal)
  expenseDate: Date;    // When expense occurred
  receiptUrl?: string;  // Optional receipt image URL
  splitBetween: string[]; // Array of user IDs to split between
  createdAt: Date;      // Creation date
  updatedAt: Date;      // Last update date
  paidBy: User;         // Who paid initially
  house: House;         // Which house the expense belongs to
  category: Category;   // Expense category
}
```

### Payment
```typescript
{
  id: string;           // UUID
  amount: number;       // Payment amount (decimal)
  memo?: string;        // Optional payment memo
  paymentDate: Date;    // When payment was made
  createdAt: Date;      // Creation date
  updatedAt: Date;      // Last update date
  fromUser: User;       // Who made the payment
  toUser: User;         // Who received the payment
  house: House;         // House context
}
```

### Balance
```typescript
{
  id: string;           // UUID
  amount: number;       // Balance amount (positive = fromUser owes toUser)
  createdAt: Date;      // Creation date
  updatedAt: Date;      // Last update date
  fromUser: User;       // User who owes
  toUser: User;         // User who is owed
  house: House;         // House context
}
```

### Category
```typescript
{
  id: string;           // UUID
  name: string;         // Category name
  description?: string; // Optional description
  color: string;        // Hex color code (default: #6B7280)
  icon?: string;        // Optional icon identifier
  isActive: boolean;    // Category status
  isDefault: boolean;   // Whether this is a default category
  sortOrder: number;    // Display order
  createdAt: Date;      // Creation date
  updatedAt: Date;      // Last update date
  house: House;         // House this category belongs to
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["email must be a valid email", "password must be at least 8 characters"],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Email already registered",
  "error": "Conflict"
}
```

---

## Testing the API

### Using cURL

#### Authentication Flow

**1. Register a new user:**
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**2. Login (save the access_token from response):**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**3. Get profile (replace TOKEN with actual JWT):**
```bash
curl -X GET http://localhost:3001/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

**4. Update profile:**
```bash
curl -X PATCH http://localhost:3001/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "firstName": "Updated",
    "profileImageUrl": "https://example.com/new-profile.jpg",
    "color": "#FF5733"
  }'
```

**5. Upload profile image:**
```bash
curl -X POST http://localhost:3001/auth/upload-profile-image \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@/path/to/your/profile-image.jpg"
```

#### House Management

**Create a house:**
```bash
curl -X POST http://localhost:3001/houses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "name": "My Shared House",
    "address": "123 Main St",
    "description": "A cozy house",
    "displayName": "Johnny"
  }'
```

**Join a house (save invite code from house creation):**
```bash
curl -X POST http://localhost:3001/houses/join \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "inviteCode": "HOUSE123",
    "displayName": "NewMember"
  }'
```

**Get user houses:**
```bash
curl -X GET http://localhost:3001/houses \
  -H "Authorization: Bearer TOKEN"
```

**Get house details (replace HOUSE_ID):**
```bash
curl -X GET http://localhost:3001/houses/HOUSE_ID \
  -H "Authorization: Bearer TOKEN"
```

**Update house details (admin only):**
```bash
curl -X PATCH http://localhost:3001/houses/HOUSE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "name": "Updated House Name",
    "imageUrl": "https://example.com/house.jpg",
    "color": "#10B981"
  }'
```

**Upload house image (admin only):**
```bash
curl -X POST http://localhost:3001/houses/HOUSE_ID/upload-image \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@/path/to/your/house-image.jpg"
```

#### Expense Management

**Create an expense (replace HOUSE_ID and CATEGORY_ID):**
```bash
curl -X POST http://localhost:3001/houses/HOUSE_ID/expenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "description": "Weekly grocery shopping",
    "amount": 125.50,
    "expenseDate": "2025-09-07",
    "splitBetween": ["USER_ID_1", "USER_ID_2"],
    "categoryId": "CATEGORY_ID"
  }'
```

**Get house expenses:**
```bash
curl -X GET http://localhost:3001/houses/HOUSE_ID/expenses \
  -H "Authorization: Bearer TOKEN"
```

#### Balance Management

**Get house balances:**
```bash
curl -X GET http://localhost:3001/houses/HOUSE_ID/balances \
  -H "Authorization: Bearer TOKEN"
```

#### Payment Management

**Create a payment (replace HOUSE_ID and TO_USER_ID):**
```bash
curl -X POST http://localhost:3001/houses/HOUSE_ID/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "amount": 62.75,
    "toUserId": "TO_USER_ID",
    "memo": "Groceries repayment",
    "paymentDate": "2025-09-07"
  }'
```

**Get all house payments:**
```bash
curl -X GET http://localhost:3001/houses/HOUSE_ID/payments \
  -H "Authorization: Bearer TOKEN"
```

**Get only user's payments:**
```bash
curl -X GET "http://localhost:3001/houses/HOUSE_ID/payments?userOnly=true" \
  -H "Authorization: Bearer TOKEN"
```

### Complete Testing Flow

Here's a complete flow to test the entire API:

```bash
# 1. Register first user
USER1=$(curl -s -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123",
    "firstName": "Alice",
    "lastName": "Smith"
  }')

# Extract token and user ID
TOKEN1=$(echo $USER1 | jq -r '.access_token')
USER1_ID=$(echo $USER1 | jq -r '.user.id')

# 2. Create a house
HOUSE=$(curl -s -X POST http://localhost:3001/houses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN1" \
  -d '{
    "name": "Test House",
    "displayName": "Alice"
  }')

# Extract house ID and invite code
HOUSE_ID=$(echo $HOUSE | jq -r '.id')
INVITE_CODE=$(echo $HOUSE | jq -r '.inviteCode')

# 3. Register second user and join house
USER2=$(curl -s -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@example.com",
    "password": "password123",
    "firstName": "Bob",
    "lastName": "Jones",
    "inviteCode": "'$INVITE_CODE'",
    "displayName": "Bob"
  }')

TOKEN2=$(echo $USER2 | jq -r '.access_token')
USER2_ID=$(echo $USER2 | jq -r '.user.id')

# 4. Create an expense (you'll need a category ID - check database or create one first)
# For testing, you can create a default category first
```

### Using the Swagger UI

Visit http://localhost:3001/api to test all endpoints interactively:

1. **Try authentication endpoints** without tokens
2. **Authorize** using the JWT token from login/register
3. **Test protected endpoints** with authentication
4. **View detailed request/response schemas**

The Swagger UI provides:
- ✅ Interactive endpoint testing
- 📋 Request/response examples  
- 🔐 Built-in authentication
- 📚 Complete API documentation