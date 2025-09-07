import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
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
  ApiNotFoundResponse,
  ApiParam,
  ApiConsumes,
} from "@nestjs/swagger";
import { HousesService } from "./houses.service";
import { CreateHouseDto } from "./dto/create-house.dto";
import { JoinHouseDto } from "./dto/join-house.dto";
import { UpdateHouseDto } from "./dto/update-house.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UploadService } from "../upload/upload.service";

@ApiTags("Houses")
@Controller("houses")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("JWT-auth")
export class HousesController {
  constructor(
    private readonly housesService: HousesService,
    private readonly uploadService: UploadService
  ) {}

  @Post()
  @ApiOperation({
    summary: "Create a new house",
    description:
      "Create a new house and become its admin. Generates a unique invite code.",
  })
  @ApiBody({ type: CreateHouseDto })
  @ApiResponse({
    status: 201,
    description: "House successfully created",
    schema: {
      example: {
        id: "uuid",
        name: "My Shared House",
        address: "123 Main St",
        description: "A cozy house",
        inviteCode: "HOUSE123",
        isActive: true,
        createdAt: "2025-09-06T12:00:00Z",
        updatedAt: "2025-09-06T12:00:00Z",
        memberships: [
          {
            id: "uuid",
            displayName: "Johnny",
            role: "admin",
            joinedAt: "2025-09-06T12:00:00Z",
            user: {
              id: "uuid",
              firstName: "John",
              lastName: "Doe",
              email: "john@example.com",
            },
          },
        ],
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid input data",
    schema: {
      example: {
        statusCode: 400,
        message: ["name should not be empty"],
        error: "Bad Request",
      },
    },
  })
  @ApiConflictResponse({
    description: "Display name already taken",
    schema: {
      example: {
        statusCode: 409,
        message: 'Display name "Johnny" is already taken in this house',
        error: "Conflict",
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Invalid or missing JWT token",
  })
  async createHouse(@Body() createHouseDto: CreateHouseDto, @Request() req) {
    return this.housesService.createHouse(createHouseDto, req.user.id);
  }

  @Post("join")
  @ApiOperation({
    summary: "Join a house",
    description: "Join an existing house using its invite code",
  })
  @ApiBody({ type: JoinHouseDto })
  @ApiResponse({
    status: 201,
    description: "Successfully joined house",
    schema: {
      example: {
        id: "uuid",
        name: "My Shared House",
        address: "123 Main St",
        description: "A cozy house",
        inviteCode: "HOUSE123",
        createdAt: "2025-09-06T12:00:00Z",
        userMembership: {
          id: "uuid",
          displayName: "Johnny",
          role: "member",
          joinedAt: "2025-09-06T12:00:00Z",
        },
        members: [
          {
            id: "uuid",
            displayName: "Admin User",
            role: "admin",
            joinedAt: "2025-09-05T10:00:00Z",
            user: {
              id: "uuid",
              firstName: "Admin",
              lastName: "User",
              email: "admin@example.com",
            },
          },
        ],
      },
    },
  })
  @ApiNotFoundResponse({
    description: "House not found or inactive",
    schema: {
      example: {
        statusCode: 404,
        message: "House not found or inactive",
        error: "Not Found",
      },
    },
  })
  @ApiConflictResponse({
    description: "Already a member or display name taken",
    schema: {
      example: {
        statusCode: 409,
        message: 'Display name "Johnny" is already taken in this house',
        error: "Conflict",
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Invalid or missing JWT token",
  })
  async joinHouse(@Body() joinHouseDto: JoinHouseDto, @Request() req) {
    return this.housesService.joinHouse(joinHouseDto, req.user.id);
  }

  @Get()
  @ApiOperation({
    summary: "Get user houses",
    description: "Get all houses the authenticated user belongs to",
  })
  @ApiResponse({
    status: 200,
    description: "List of houses user belongs to",
    schema: {
      example: [
        {
          id: "uuid",
          name: "My Shared House",
          address: "123 Main St",
          description: "A cozy house",
          inviteCode: "HOUSE123",
          createdAt: "2025-09-06T12:00:00Z",
          membership: {
            id: "uuid",
            displayName: "Johnny",
            role: "admin",
            joinedAt: "2025-09-06T12:00:00Z",
          },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: "Invalid or missing JWT token",
  })
  async getUserHouses(@Request() req) {
    return this.housesService.getUserHouses(req.user.id);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get house details",
    description:
      "Get detailed information about a specific house including all members",
  })
  @ApiParam({
    name: "id",
    description: "House UUID",
    example: "uuid",
  })
  @ApiResponse({
    status: 200,
    description: "House details with members",
    schema: {
      example: {
        id: "uuid",
        name: "My Shared House",
        address: "123 Main St",
        description: "A cozy house",
        inviteCode: "HOUSE123",
        createdAt: "2025-09-06T12:00:00Z",
        userMembership: {
          id: "uuid",
          displayName: "Johnny",
          role: "admin",
          joinedAt: "2025-09-06T12:00:00Z",
        },
        members: [
          {
            id: "uuid",
            displayName: "Johnny",
            role: "admin",
            joinedAt: "2025-09-06T12:00:00Z",
            user: {
              id: "uuid",
              firstName: "John",
              lastName: "Doe",
              email: "john@example.com",
            },
          },
        ],
      },
    },
  })
  @ApiNotFoundResponse({
    description: "House not found or user is not a member",
    schema: {
      example: {
        statusCode: 404,
        message: "House not found or you are not a member",
        error: "Not Found",
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Invalid or missing JWT token",
  })
  async getHouseDetails(@Param("id") id: string, @Request() req) {
    return this.housesService.getHouseDetails(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Update house details",
    description:
      "Update house information including name, address, description, image, and color. Only admins can update house details.",
  })
  @ApiParam({
    name: "id",
    description: "House UUID",
    example: "uuid",
  })
  @ApiBody({ type: UpdateHouseDto })
  @ApiResponse({
    status: 200,
    description: "House updated successfully",
    schema: {
      example: {
        id: "uuid",
        name: "Updated House Name",
        address: "456 New Address St",
        description: "Updated description",
        inviteCode: "HOUSE123",
        imageUrl: "https://example.com/house.jpg",
        color: "#10B981",
        createdAt: "2025-09-06T12:00:00Z",
        updatedAt: "2025-09-07T14:00:00Z",
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid input data or invalid URL/color format",
  })
  @ApiUnauthorizedResponse({
    description: "Invalid or missing JWT token",
  })
  @ApiNotFoundResponse({
    description:
      "House not found, user is not a member, or user is not an admin",
  })
  async updateHouse(
    @Param("id") id: string,
    @Body() updateHouseDto: UpdateHouseDto,
    @Request() req
  ) {
    return this.housesService.updateHouse(id, req.user.id, updateHouseDto);
  }

  @Post(":id/upload-image")
  @UseInterceptors(
    FileInterceptor("image", {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit (larger for house images)
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
    summary: "Upload house image",
    description:
      "Upload a house image and automatically update the house's imageUrl. Only house admins can upload images. Supports JPEG, PNG, GIF, and WebP formats. Maximum file size: 10MB.",
  })
  @ApiParam({
    name: "id",
    description: "House UUID",
    example: "uuid",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        image: {
          type: "string",
          format: "binary",
          description: "House image file",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "House image uploaded successfully",
    schema: {
      example: {
        id: "uuid",
        name: "Updated House Name",
        address: "456 New Address St",
        description: "Updated description",
        inviteCode: "HOUSE123",
        imageUrl:
          "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/roomiesync/houses/def456.jpg",
        color: "#10B981",
        createdAt: "2025-09-06T12:00:00Z",
        updatedAt: "2025-09-07T14:00:00Z",
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
  @ApiNotFoundResponse({
    description:
      "House not found, user is not a member, or user is not an admin",
  })
  async uploadHouseImage(
    @Param("id") houseId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req
  ) {
    if (!file) {
      throw new BadRequestException("No image file provided");
    }

    // Upload to Cloudinary
    const imageUrl = await this.uploadService.uploadImage(file, "houses", [
      { width: 1200, height: 800, crop: "limit" }, // Larger dimensions for house images
      { quality: "auto" },
    ]);

    // Update house image URL (this automatically checks admin permissions)
    return this.housesService.updateHouse(houseId, req.user.id, { imageUrl });
  }
}
