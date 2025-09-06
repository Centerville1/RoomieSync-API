# RoomieSync API Documentation

## Base URL
```
http://localhost:3001
```

## Interactive Documentation
📚 **Swagger UI**: http://localhost:3001/api

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

**Register a new user:**
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

**Login:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Get profile (replace TOKEN with actual JWT):**
```bash
curl -X GET http://localhost:3001/auth/profile \
  -H "Authorization: Bearer TOKEN"
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