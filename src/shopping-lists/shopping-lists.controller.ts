import { Controller, Get, Post, Body, Param, UseGuards, Request, Patch, Delete, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiQuery,
  ApiConflictResponse
} from '@nestjs/swagger';
import { ShoppingListsService } from './shopping-lists.service';
import { CreateShoppingItemDto } from './dto/create-shopping-item.dto';
import { UpdateShoppingItemDto } from './dto/update-shopping-item.dto';
import { BatchPurchaseDto } from './dto/batch-purchase.dto';
import { GetItemsQueryDto } from './dto/get-items-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Shopping Lists')
@Controller('houses/:houseId/shopping-list')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ShoppingListsController {
  constructor(private readonly shoppingListsService: ShoppingListsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get house shopping list',
    description: 'Get the primary shopping list for the house with all items'
  })
  @ApiParam({
    name: 'houseId',
    description: 'House UUID',
    example: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'House shopping list with items',
    schema: {
      example: {
        id: 'uuid',
        name: 'Shopping List',
        isActive: true,
        createdAt: '2025-09-06T12:00:00Z',
        updatedAt: '2025-09-06T12:00:00Z',
        items: [
          {
            id: 'uuid',
            name: 'Milk',
            quantity: 2,
            notes: '2% milk',
            purchasedAt: null,
            isRecurring: true,
            recurringInterval: 7,
            category: {
              id: 'uuid',
              name: 'Groceries',
              description: 'Food and household essentials',
              color: '#6B7280',
              icon: 'shopping-cart'
            },
            assignedTo: {
              id: 'uuid',
              firstName: 'John',
              lastName: 'Doe'
            }
          }
        ]
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiNotFoundResponse({
    description: 'House not found or user is not a member'
  })
  async getHouseShoppingList(@Param('houseId') houseId: string, @Request() req) {
    return this.shoppingListsService.getHouseShoppingList(houseId, req.user.id);
  }

  @Get('items')
  @ApiOperation({
    summary: 'Get shopping list items with filtering',
    description: 'Get shopping list items with optional category and assignment filtering'
  })
  @ApiParam({
    name: 'houseId',
    description: 'House UUID',
    example: 'uuid'
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID'
  })
  @ApiQuery({
    name: 'assignedToId',
    required: false,
    description: 'Filter by assigned user ID'
  })
  @ApiQuery({
    name: 'includePurchased',
    required: false,
    description: 'Include purchased items',
    type: 'boolean'
  })
  @ApiResponse({
    status: 200,
    description: 'Filtered shopping list items',
    schema: {
      type: 'array',
      items: {
        example: {
          id: 'uuid',
          name: 'Bread',
          quantity: 1,
          notes: null,
          purchasedAt: null,
          isRecurring: false,
          category: null,
          assignedTo: null
        }
      }
    }
  })
  async getShoppingListItems(
    @Param('houseId') houseId: string,
    @Query() query: GetItemsQueryDto,
    @Request() req
  ) {
    return this.shoppingListsService.getShoppingListItems(houseId, req.user.id, query);
  }

  @Get('recent-recurring')
  @ApiOperation({
    summary: 'Get recent recurring items',
    description: 'Get recently purchased recurring items with countdown until they return'
  })
  @ApiParam({
    name: 'houseId',
    description: 'House UUID',
    example: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Recent recurring items with return countdown',
    schema: {
      type: 'array',
      items: {
        example: {
          id: 'uuid',
          name: 'Milk',
          quantity: 2,
          purchasedAt: '2025-09-01T10:00:00Z',
          recurringInterval: 7,
          daysUntilReturn: 3,
          hasRecurred: false,
          purchasedBy: {
            id: 'uuid',
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      }
    }
  })
  async getRecentRecurringItems(@Param('houseId') houseId: string, @Request() req) {
    return this.shoppingListsService.getRecentRecurringItems(houseId, req.user.id);
  }

  @Post('items')
  @ApiOperation({
    summary: 'Add shopping item',
    description: 'Add a new item to the shopping list with optional recurring settings'
  })
  @ApiParam({
    name: 'houseId',
    description: 'House UUID',
    example: 'uuid'
  })
  @ApiBody({ type: CreateShoppingItemDto })
  @ApiResponse({
    status: 201,
    description: 'Shopping item created successfully',
    schema: {
      example: {
        id: 'uuid',
        name: 'Eggs',
        quantity: 12,
        notes: 'Free range',
        purchasedAt: null,
        isRecurring: true,
        recurringInterval: 14,
        category: {
          id: 'uuid',
          name: 'Groceries',
          description: 'Food and household essentials',
          color: '#6B7280',
          icon: 'shopping-cart'
        },
        assignedTo: null
      }
    }
  })
  @ApiConflictResponse({
    description: 'Potential duplicate items detected',
    schema: {
      example: {
        message: 'Potential duplicate items detected',
        warnings: [
          'Similar item "Milk" was recently purchased and will return in 5 day(s). Add anyway?'
        ],
        suggestion: 'Add "force": true to your request to proceed anyway'
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data, category not found, or assigned user not a member'
  })
  async addShoppingItem(
    @Param('houseId') houseId: string,
    @Body() createDto: CreateShoppingItemDto,
    @Request() req
  ) {
    return this.shoppingListsService.addShoppingItem(houseId, req.user.id, createDto);
  }

  @Patch('items/:itemId')
  @ApiOperation({
    summary: 'Update shopping item',
    description: 'Update an existing shopping list item'
  })
  @ApiParam({
    name: 'houseId',
    description: 'House UUID',
    example: 'uuid'
  })
  @ApiParam({
    name: 'itemId',
    description: 'Shopping item UUID',
    example: 'uuid'
  })
  @ApiBody({ type: UpdateShoppingItemDto })
  @ApiResponse({
    status: 200,
    description: 'Shopping item updated successfully'
  })
  @ApiNotFoundResponse({
    description: 'Shopping item not found'
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or validation errors'
  })
  async updateShoppingItem(
    @Param('houseId') houseId: string,
    @Param('itemId') itemId: string,
    @Body() updateDto: UpdateShoppingItemDto,
    @Request() req
  ) {
    return this.shoppingListsService.updateShoppingItem(houseId, req.user.id, itemId, updateDto);
  }

  @Post('items/:itemId/purchase')
  @ApiOperation({
    summary: 'Purchase shopping item',
    description: 'Mark a shopping item as purchased'
  })
  @ApiParam({
    name: 'houseId',
    description: 'House UUID',
    example: 'uuid'
  })
  @ApiParam({
    name: 'itemId',
    description: 'Shopping item UUID',
    example: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Item marked as purchased successfully',
    schema: {
      example: {
        id: 'uuid',
        name: 'Milk',
        purchasedAt: '2025-09-06T14:30:00Z',
        purchasedBy: {
          id: 'uuid',
          firstName: 'John',
          lastName: 'Doe'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Shopping item not found'
  })
  @ApiBadRequestResponse({
    description: 'Item is already purchased'
  })
  async purchaseItem(
    @Param('houseId') houseId: string,
    @Param('itemId') itemId: string,
    @Request() req
  ) {
    return this.shoppingListsService.purchaseItem(houseId, req.user.id, itemId);
  }

  @Post('items/batch-purchase')
  @ApiOperation({
    summary: 'Batch purchase items',
    description: 'Mark multiple shopping items as purchased in one operation'
  })
  @ApiParam({
    name: 'houseId',
    description: 'House UUID',
    example: 'uuid'
  })
  @ApiBody({ type: BatchPurchaseDto })
  @ApiResponse({
    status: 200,
    description: 'Items marked as purchased successfully',
    schema: {
      type: 'array',
      items: {
        example: {
          id: 'uuid',
          name: 'Bread',
          purchasedAt: '2025-09-06T14:30:00Z',
          purchasedBy: {
            id: 'uuid',
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'One or more shopping items not found'
  })
  @ApiBadRequestResponse({
    description: 'Some items do not belong to this house or are already purchased'
  })
  async batchPurchaseItems(
    @Param('houseId') houseId: string,
    @Body() batchDto: BatchPurchaseDto,
    @Request() req
  ) {
    return this.shoppingListsService.batchPurchaseItems(houseId, req.user.id, batchDto);
  }

  @Delete('items/:itemId')
  @ApiOperation({
    summary: 'Delete shopping item',
    description: 'Remove a shopping item from the list'
  })
  @ApiParam({
    name: 'houseId',
    description: 'House UUID',
    example: 'uuid'
  })
  @ApiParam({
    name: 'itemId',
    description: 'Shopping item UUID',
    example: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Shopping item deleted successfully'
  })
  @ApiNotFoundResponse({
    description: 'Shopping item not found'
  })
  async deleteShoppingItem(
    @Param('houseId') houseId: string,
    @Param('itemId') itemId: string,
    @Request() req
  ) {
    await this.shoppingListsService.deleteShoppingItem(houseId, req.user.id, itemId);
    return { message: 'Shopping item deleted successfully' };
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get purchase history',
    description: 'Get all purchased items from the shopping list'
  })
  @ApiParam({
    name: 'houseId',
    description: 'House UUID',
    example: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Purchase history',
    schema: {
      type: 'array',
      items: {
        example: {
          id: 'uuid',
          name: 'Milk',
          quantity: 2,
          purchasedAt: '2025-09-05T10:00:00Z',
          isRecurring: true,
          lastRecurredAt: '2025-09-06T10:00:00Z',
          purchasedBy: {
            id: 'uuid',
            firstName: 'John',
            lastName: 'Doe'
          },
          category: {
            id: 'uuid',
            name: 'Groceries',
            description: 'Food and household essentials',
            color: '#6B7280',
            icon: 'shopping-cart'
          }
        }
      }
    }
  })
  async getPurchaseHistory(@Param('houseId') houseId: string, @Request() req) {
    return this.shoppingListsService.getPurchaseHistory(houseId, req.user.id);
  }
}