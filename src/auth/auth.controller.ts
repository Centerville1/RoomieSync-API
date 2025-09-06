import { Controller, Post, Body, Request, UseGuards, Get } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ 
    summary: 'Register a new user',
    description: 'Create a new user account. Optionally join a house using an invite code.'
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully registered and logged in',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIs...',
        user: {
          id: 'uuid',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          houseMemberships: []
        }
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: ['email must be a valid email'],
        error: 'Bad Request'
      }
    }
  })
  @ApiConflictResponse({ 
    description: 'Email or display name already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'Email already registered',
        error: 'Conflict'
      }
    }
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ 
    summary: 'Login user',
    description: 'Authenticate user with email and password'
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'User successfully authenticated',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIs...',
        user: {
          id: 'uuid',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          houseMemberships: [{
            id: 'uuid',
            displayName: 'Johnny',
            role: 'member',
            house: {
              id: 'uuid',
              name: 'My House',
              inviteCode: 'HOUSE123'
            }
          }]
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: 'Invalid credentials',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized'
      }
    }
  })
  async login(@Request() req, @Body() loginDto: LoginDto) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get current user profile',
    description: 'Retrieve the authenticated user\'s profile information'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile data',
    schema: {
      example: {
        id: 'uuid',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe'
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: 'Invalid or missing JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  getProfile(@Request() req) {
    return req.user;
  }
}