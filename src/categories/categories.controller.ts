import { Controller, Get, Post, Body, Param, UseGuards, Request, Put, Delete } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiParam
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Categories')
@Controller('houses/:houseId/categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a category in house',
    description: 'Create a new expense category for the house'
  })
  @ApiParam({ name: 'houseId', description: 'House UUID' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    schema: {
      example: {
        id: 'uuid',
        name: 'Groceries',
        description: 'Food and household essentials',
        color: '#10B981',
        icon: 'shopping-cart',
        isActive: true,
        isDefault: false,
        sortOrder: 1,
        createdAt: '2025-09-06T12:00:00Z',
        updatedAt: '2025-09-06T12:00:00Z',
        houseId: 'house-uuid'
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or house not found'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async createCategory(
    @Param('houseId') houseId: string,
    @Body() createCategoryDto: CreateCategoryDto,
    @Request() req
  ) {
    return this.categoriesService.createCategory(createCategoryDto, req.user.id, houseId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get house categories',
    description: 'Get all expense categories for the house'
  })
  @ApiParam({ name: 'houseId', description: 'House UUID' })
  @ApiResponse({
    status: 200,
    description: 'List of house categories',
    schema: {
      example: [{
        id: 'uuid',
        name: 'Groceries',
        description: 'Food and household essentials',
        color: '#10B981',
        icon: 'shopping-cart',
        isActive: true,
        isDefault: true,
        sortOrder: 1,
        createdAt: '2025-09-06T12:00:00Z',
        updatedAt: '2025-09-06T12:00:00Z'
      }]
    }
  })
  @ApiNotFoundResponse({
    description: 'House not found or user is not a member'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async getHouseCategories(@Param('houseId') houseId: string, @Request() req) {
    return this.categoriesService.getHouseCategories(req.user.id, houseId);
  }

  @Put(':categoryId')
  @ApiOperation({
    summary: 'Update a category',
    description: 'Update an existing expense category'
  })
  @ApiParam({ name: 'houseId', description: 'House UUID' })
  @ApiParam({ name: 'categoryId', description: 'Category UUID' })
  @ApiBody({ type: CreateCategoryDto })
  async updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() updateData: Partial<CreateCategoryDto>,
    @Request() req
  ) {
    return this.categoriesService.updateCategory(categoryId, updateData, req.user.id);
  }

  @Delete(':categoryId')
  @ApiOperation({
    summary: 'Delete a category',
    description: 'Soft delete an expense category'
  })
  @ApiParam({ name: 'houseId', description: 'House UUID' })
  @ApiParam({ name: 'categoryId', description: 'Category UUID' })
  async deleteCategory(@Param('categoryId') categoryId: string, @Request() req) {
    return this.categoriesService.deleteCategory(categoryId, req.user.id);
  }
}