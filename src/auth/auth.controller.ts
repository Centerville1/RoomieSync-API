import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Get,
  Patch,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Param,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiConsumes,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { UploadService } from "../upload/upload.service";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private uploadService: UploadService
  ) {}

  @Post("register")
  @ApiOperation({
    summary: "Register a new user",
    description:
      "Create a new user account. Optionally join a house using an invite code.",
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: "User successfully registered and logged in",
    schema: {
      example: {
        access_token: "eyJhbGciOiJIUzI1NiIs...",
        user: {
          id: "uuid",
          email: "john@example.com",
          firstName: "John",
          lastName: "Doe",
          houseMemberships: [],
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid input data",
    schema: {
      example: {
        statusCode: 400,
        message: ["email must be a valid email"],
        error: "Bad Request",
      },
    },
  })
  @ApiConflictResponse({
    description: "Email or display name already exists",
    schema: {
      example: {
        statusCode: 409,
        message: "Email already registered",
        error: "Conflict",
      },
    },
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post("login")
  @ApiOperation({
    summary: "Login user",
    description: "Authenticate user with email and password",
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: "User successfully authenticated",
    schema: {
      example: {
        access_token: "eyJhbGciOiJIUzI1NiIs...",
        user: {
          id: "uuid",
          email: "john@example.com",
          firstName: "John",
          lastName: "Doe",
          houseMemberships: [
            {
              id: "uuid",
              displayName: "Johnny",
              role: "member",
              house: {
                id: "uuid",
                name: "My House",
                inviteCode: "HOUSE123",
              },
            },
          ],
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Invalid credentials",
    schema: {
      example: {
        statusCode: 401,
        message: "Invalid credentials",
        error: "Unauthorized",
      },
    },
  })
  async login(@Request() req, @Body() loginDto: LoginDto) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get current user profile",
    description: "Retrieve the authenticated user's profile information",
  })
  @ApiResponse({
    status: 200,
    description: "User profile data",
    schema: {
      example: {
        id: "uuid",
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
        phoneNumber: "+1234567890",
        profileImageUrl: "https://example.com/profile.jpg",
        color: "#6366F1",
        isActive: true,
        createdAt: "2025-09-06T12:00:00Z",
        updatedAt: "2025-09-06T12:00:00Z",
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Invalid or missing JWT token",
    schema: {
      example: {
        statusCode: 401,
        message: "Unauthorized",
        error: "Unauthorized",
      },
    },
  })
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("profile")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Update user profile",
    description:
      "Update user profile information including name, phone, profile image, and color",
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: "Profile updated successfully",
    schema: {
      example: {
        id: "uuid",
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
        phoneNumber: "+1234567890",
        profileImageUrl: "https://example.com/profile.jpg",
        color: "#6366F1",
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid input data or invalid URL/color format",
  })
  @ApiUnauthorizedResponse({
    description: "Invalid or missing JWT token",
  })
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto
  ) {
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post("upload-profile-image")
  @ApiBearerAuth("JWT-auth")
  @UseInterceptors(
    FileInterceptor("image", {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (req, file, cb) => {
        // Only allow image files
        if (!file.mimetype.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
          return cb(
            new Error("Only image files (JPEG, PNG, GIF, WebP) are allowed"),
            false
          );
        }
        cb(null, true);
      },
    })
  )
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary: "Upload profile image",
    description:
      "Upload a profile image and automatically update the user's profileImageUrl. Supports JPEG, PNG, GIF, and WebP formats. Maximum file size: 5MB.",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        image: {
          type: "string",
          format: "binary",
          description: "Profile image file",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Profile image uploaded successfully",
    schema: {
      example: {
        id: "uuid",
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
        phoneNumber: "+1234567890",
        profileImageUrl:
          "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/roomiesync/profiles/abc123.jpg",
        color: "#6366F1",
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid file format, file too large, or upload failed",
    schema: {
      example: {
        statusCode: 400,
        message: "Only image files (JPEG, PNG, GIF, WebP) are allowed",
        error: "Bad Request",
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Invalid or missing JWT token",
  })
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @Request() req
  ) {
    if (!file) {
      throw new BadRequestException("No image file provided");
    }

    // Upload to Cloudinary
    const imageUrl = await this.uploadService.uploadImage(file, "profiles");

    // Update user's profile image URL
    return this.authService.updateProfile(req.user.id, {
      profileImageUrl: imageUrl,
    });
  }

  @Post("forgot-password")
  @ApiOperation({
    summary: "Request password reset",
    description:
      "Send a password reset link to the user's email address. Always returns success to prevent email enumeration.",
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: "Password reset email sent (if email exists)",
    schema: {
      example: {
        message:
          "If an account with that email exists, we have sent you a password reset link.",
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid email format",
    schema: {
      example: {
        statusCode: 400,
        message: ["Please provide a valid email address"],
        error: "Bad Request",
      },
    },
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Get("reset-password/:token")
  @ApiOperation({
    summary: "Verify password reset token",
    description:
      "Check if a password reset token is valid and not expired. Used by frontend to validate token before showing reset form.",
  })
  @ApiResponse({
    status: 200,
    description: "Token verification result",
    schema: {
      example: {
        valid: true,
        message: "Token is valid",
      },
    },
  })
  async verifyResetToken(@Param("token") token: string) {
    return this.authService.verifyResetToken(token);
  }

  @Post("reset-password")
  @ApiOperation({
    summary: "Reset password",
    description:
      "Reset user password using a valid reset token and new password.",
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: "Password reset successfully",
    schema: {
      example: {
        message: "Password has been reset successfully",
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid token, expired token, or invalid password format",
    schema: {
      examples: {
        invalidToken: {
          summary: "Invalid or expired token",
          value: {
            statusCode: 400,
            message: "Invalid or expired reset token",
            error: "Bad Request",
          },
        },
        invalidPassword: {
          summary: "Invalid password format",
          value: {
            statusCode: 400,
            message: [
              "Password must be at least 8 characters long",
              "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
            ],
            error: "Bad Request",
          },
        },
      },
    },
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
