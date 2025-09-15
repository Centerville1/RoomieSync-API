import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, In } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { ShoppingList, ShoppingItem, HouseMembership, Category } from '../entities';
import { CreateShoppingItemDto } from './dto/create-shopping-item.dto';
import { UpdateShoppingItemDto } from './dto/update-shopping-item.dto';
import { BatchPurchaseDto } from './dto/batch-purchase.dto';
import { GetItemsQueryDto } from './dto/get-items-query.dto';
import { HouseMembersService } from '../common/house-members.service';

@Injectable()
export class ShoppingListsService {
  constructor(
    @InjectRepository(ShoppingList)
    private shoppingListRepository: Repository<ShoppingList>,
    @InjectRepository(ShoppingItem)
    private shoppingItemRepository: Repository<ShoppingItem>,
    @InjectRepository(HouseMembership)
    private houseMembershipRepository: Repository<HouseMembership>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private houseMembersService: HouseMembersService,
  ) {}

  @Cron('0 */6 * * *') // Every 6 hours
  async handleRecurringItems() {
    console.log('Checking for recurring items...');
    
    // Find items that need to recur
    const itemsToRecur = await this.shoppingItemRepository
      .createQueryBuilder('item')
      .where('item.isRecurring = :isRecurring', { isRecurring: true })
      .andWhere('item.purchasedAt IS NOT NULL')
      .andWhere('item.purchasedAt + INTERVAL item.recurringInterval DAY <= NOW()')
      .andWhere('(item.lastRecurredAt IS NULL OR item.lastRecurredAt < item.purchasedAt)')
      .getMany();

    for (const item of itemsToRecur) {
      await this.createRecurringItem(item);
    }

    if (itemsToRecur.length > 0) {
      console.log(`Created ${itemsToRecur.length} recurring items`);
    }
  }

  async getHouseShoppingList(houseId: string, userId: string): Promise<ShoppingList> {
    await this.verifyHouseMembership(userId, houseId);

    const shoppingList = await this.shoppingListRepository.findOne({
      where: { primaryForHouse: { id: houseId } },
      relations: ['items', 'items.category', 'items.assignedTo', 'items.purchasedBy']
    });

    if (!shoppingList) {
      throw new NotFoundException('Shopping list not found for this house');
    }

    // Get house members map for display names and colors
    const membersMap = await this.houseMembersService.getHouseMembersMap(houseId);

    // Enhance user objects in items
    if (shoppingList.items) {
      shoppingList.items = shoppingList.items.map(item => ({
        ...item,
        assignedTo: item.assignedTo ? this.houseMembersService.enhanceUserObject(item.assignedTo, membersMap) : null,
        purchasedBy: item.purchasedBy ? this.houseMembersService.enhanceUserObject(item.purchasedBy, membersMap) : null,
      }));
    }

    return shoppingList;
  }

  async getShoppingListItems(houseId: string, userId: string, query: GetItemsQueryDto) {
    await this.verifyHouseMembership(userId, houseId);

    const shoppingList = await this.shoppingListRepository.findOne({
      where: { primaryForHouse: { id: houseId } }
    });

    if (!shoppingList) {
      throw new NotFoundException('Shopping list not found for this house');
    }

    let queryBuilder = this.shoppingItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('item.assignedTo', 'assignedTo')
      .leftJoinAndSelect('item.purchasedBy', 'purchasedBy')
      .where('item.shoppingListId = :listId', { listId: shoppingList.id })
      .orderBy('item.createdAt', 'DESC');

    // Filter by purchased status
    if (!query.includePurchased) {
      queryBuilder = queryBuilder.andWhere('item.purchasedAt IS NULL');
    }

    // Filter by category
    if (query.categoryId) {
      queryBuilder = queryBuilder.andWhere('item.categoryId = :categoryId', { categoryId: query.categoryId });
    }

    // Filter by assigned user
    if (query.assignedToId) {
      queryBuilder = queryBuilder.andWhere('item.assignedToId = :assignedToId', { assignedToId: query.assignedToId });
    }

    const items = await queryBuilder.getMany();

    // Get house members map for display names and colors
    const membersMap = await this.houseMembersService.getHouseMembersMap(houseId);

    // Enhance user objects in items
    return items.map(item => ({
      ...item,
      assignedTo: item.assignedTo ? this.houseMembersService.enhanceUserObject(item.assignedTo, membersMap) : null,
      purchasedBy: item.purchasedBy ? this.houseMembersService.enhanceUserObject(item.purchasedBy, membersMap) : null,
    }));
  }

  async getRecentRecurringItems(houseId: string, userId: string) {
    await this.verifyHouseMembership(userId, houseId);

    const shoppingList = await this.shoppingListRepository.findOne({
      where: { primaryForHouse: { id: houseId } }
    });

    if (!shoppingList) {
      throw new NotFoundException('Shopping list not found for this house');
    }

    const recentRecurringItems = await this.shoppingItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('item.purchasedBy', 'purchasedBy')
      .where('item.shoppingListId = :listId', { listId: shoppingList.id })
      .andWhere('item.isRecurring = :isRecurring', { isRecurring: true })
      .andWhere('item.purchasedAt IS NOT NULL')
      .andWhere('item.purchasedAt > NOW() - INTERVAL 30 DAY') // Last 30 days
      .orderBy('item.purchasedAt', 'DESC')
      .getMany();

    // Get house members map for display names and colors
    const membersMap = await this.houseMembersService.getHouseMembersMap(houseId);

    return recentRecurringItems.map(item => ({
      ...item,
      purchasedBy: item.purchasedBy ? this.houseMembersService.enhanceUserObject(item.purchasedBy, membersMap) : null,
      daysUntilReturn: this.calculateDaysUntilReturn(item),
      hasRecurred: item.lastRecurredAt && item.lastRecurredAt >= item.purchasedAt
    }));
  }

  async addShoppingItem(houseId: string, userId: string, createDto: CreateShoppingItemDto): Promise<ShoppingItem> {
    await this.verifyHouseMembership(userId, houseId);
    
    const shoppingList = await this.getHouseShoppingList(houseId, userId);

    // Check for similar recent recurring items
    const warnings = await this.checkForSimilarRecurringItems(houseId, createDto.name);

    // If warnings exist and force is not true, throw conflict
    if (warnings.length > 0 && !createDto.force) {
      throw new ConflictException({
        message: 'Potential duplicate items detected',
        warnings,
        suggestion: 'Add "force": true to your request to proceed anyway'
      });
    }

    // Validate category if provided
    if (createDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: createDto.categoryId, houseId }
      });
      if (!category) {
        throw new BadRequestException('Category not found in this house');
      }
    }

    // Validate assigned user if provided
    if (createDto.assignedToId) {
      const membership = await this.houseMembershipRepository.findOne({
        where: { userId: createDto.assignedToId, houseId }
      });
      if (!membership) {
        throw new BadRequestException('Assigned user is not a member of this house');
      }
    }

    // Validate recurring item
    if (createDto.isRecurring && !createDto.recurringInterval) {
      throw new BadRequestException('Recurring interval is required for recurring items');
    }

    const item = this.shoppingItemRepository.create({
      ...createDto,
      shoppingListId: shoppingList.id,
      quantity: createDto.quantity || 1
    });

    const savedItem = await this.shoppingItemRepository.save(item);
    
    // Return with relations and enhanced user objects
    const itemWithRelations = await this.shoppingItemRepository.findOne({
      where: { id: savedItem.id },
      relations: ['category', 'assignedTo', 'purchasedBy']
    });

    // Get house members map for display names and colors
    const membersMap = await this.houseMembersService.getHouseMembersMap(houseId);

    return this.enhanceItemUserObjects(itemWithRelations, membersMap);
  }

  async updateShoppingItem(houseId: string, userId: string, itemId: string, updateDto: UpdateShoppingItemDto): Promise<ShoppingItem> {
    await this.verifyHouseMembership(userId, houseId);
    
    const item = await this.shoppingItemRepository.findOne({
      where: { id: itemId },
      relations: ['shoppingList', 'shoppingList.primaryForHouse']
    });

    if (!item) {
      throw new NotFoundException('Shopping item not found');
    }

    // Verify item belongs to this house
    if (item.shoppingList.primaryForHouse?.id !== houseId) {
      throw new ForbiddenException('Item does not belong to this house');
    }

    // Validate category if being updated
    if (updateDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateDto.categoryId, houseId }
      });
      if (!category) {
        throw new BadRequestException('Category not found in this house');
      }
    }

    // Validate assigned user if being updated
    if (updateDto.assignedToId) {
      const membership = await this.houseMembershipRepository.findOne({
        where: { userId: updateDto.assignedToId, houseId }
      });
      if (!membership) {
        throw new BadRequestException('Assigned user is not a member of this house');
      }
    }

    // Validate recurring item
    if (updateDto.isRecurring && !updateDto.recurringInterval && !item.recurringInterval) {
      throw new BadRequestException('Recurring interval is required for recurring items');
    }

    Object.assign(item, updateDto);
    await this.shoppingItemRepository.save(item);

    // Return with relations and enhanced user objects
    const itemWithRelations = await this.shoppingItemRepository.findOne({
      where: { id: itemId },
      relations: ['category', 'assignedTo', 'purchasedBy']
    });

    // Get house members map for display names and colors
    const membersMap = await this.houseMembersService.getHouseMembersMap(houseId);

    return this.enhanceItemUserObjects(itemWithRelations, membersMap);
  }

  async purchaseItem(houseId: string, userId: string, itemId: string): Promise<ShoppingItem> {
    await this.verifyHouseMembership(userId, houseId);
    
    const item = await this.shoppingItemRepository.findOne({
      where: { id: itemId },
      relations: ['shoppingList', 'shoppingList.primaryForHouse']
    });

    if (!item) {
      throw new NotFoundException('Shopping item not found');
    }

    // Verify item belongs to this house
    if (item.shoppingList.primaryForHouse?.id !== houseId) {
      throw new ForbiddenException('Item does not belong to this house');
    }

    if (item.purchasedAt) {
      throw new BadRequestException('Item is already purchased');
    }

    item.purchasedAt = new Date();
    item.purchasedById = userId;
    await this.shoppingItemRepository.save(item);

    // Note: Recurring item creation now handled by cron job, not immediately

    // Return with relations and enhanced user objects
    const itemWithRelations = await this.shoppingItemRepository.findOne({
      where: { id: itemId },
      relations: ['category', 'assignedTo', 'purchasedBy']
    });

    // Get house members map for display names and colors
    const membersMap = await this.houseMembersService.getHouseMembersMap(houseId);

    return this.enhanceItemUserObjects(itemWithRelations, membersMap);
  }

  async batchPurchaseItems(houseId: string, userId: string, batchDto: BatchPurchaseDto): Promise<ShoppingItem[]> {
    await this.verifyHouseMembership(userId, houseId);
    
    const items = await this.shoppingItemRepository.find({
      where: { id: In(batchDto.itemIds) },
      relations: ['shoppingList', 'shoppingList.primaryForHouse']
    });

    if (items.length !== batchDto.itemIds.length) {
      throw new NotFoundException('One or more shopping items not found');
    }

    // Verify all items belong to this house
    const invalidItems = items.filter(item => 
      item.shoppingList.primaryForHouse?.id !== houseId || 
      item.purchasedAt !== null
    );

    if (invalidItems.length > 0) {
      throw new BadRequestException('Some items do not belong to this house or are already purchased');
    }

    // Get house members map for display names and colors (once for all items)
    const membersMap = await this.houseMembersService.getHouseMembersMap(houseId);

    // Update all items
    const now = new Date();
    const updatedItems: ShoppingItem[] = [];

    for (const item of items) {
      item.purchasedAt = now;
      item.purchasedById = userId;
      await this.shoppingItemRepository.save(item);

      // Get updated item with relations and enhance user objects
      const updatedItem = await this.shoppingItemRepository.findOne({
        where: { id: item.id },
        relations: ['category', 'assignedTo', 'purchasedBy']
      });
      updatedItems.push(this.enhanceItemUserObjects(updatedItem, membersMap));
    }

    // Note: Recurring item creation now handled by cron job, not immediately

    return updatedItems;
  }

  async deleteShoppingItem(houseId: string, userId: string, itemId: string): Promise<void> {
    await this.verifyHouseMembership(userId, houseId);
    
    const item = await this.shoppingItemRepository.findOne({
      where: { id: itemId },
      relations: ['shoppingList', 'shoppingList.primaryForHouse']
    });

    if (!item) {
      throw new NotFoundException('Shopping item not found');
    }

    // Verify item belongs to this house
    if (item.shoppingList.primaryForHouse?.id !== houseId) {
      throw new ForbiddenException('Item does not belong to this house');
    }

    await this.shoppingItemRepository.remove(item);
  }

  async getPurchaseHistory(houseId: string, userId: string): Promise<ShoppingItem[]> {
    await this.verifyHouseMembership(userId, houseId);

    const shoppingList = await this.shoppingListRepository.findOne({
      where: { primaryForHouse: { id: houseId } }
    });

    if (!shoppingList) {
      throw new NotFoundException('Shopping list not found for this house');
    }

    const items = await this.shoppingItemRepository.find({
      where: {
        shoppingListId: shoppingList.id,
        purchasedAt: Not(IsNull())
      },
      relations: ['category', 'assignedTo', 'purchasedBy'],
      order: { purchasedAt: 'DESC' }
    });

    // Get house members map for display names and colors
    const membersMap = await this.houseMembersService.getHouseMembersMap(houseId);

    // Enhance user objects in items
    return items.map(item => this.enhanceItemUserObjects(item, membersMap));
  }

  private async createRecurringItem(originalItem: ShoppingItem): Promise<void> {
    // Create a new item based on the purchased recurring item
    const recurringItem = this.shoppingItemRepository.create({
      name: originalItem.name,
      quantity: originalItem.quantity,
      notes: originalItem.notes,
      categoryId: originalItem.categoryId,
      assignedToId: originalItem.assignedToId,
      isRecurring: originalItem.isRecurring,
      recurringInterval: originalItem.recurringInterval,
      shoppingListId: originalItem.shoppingListId
    });

    await this.shoppingItemRepository.save(recurringItem);

    // Update the original item's lastRecurredAt
    originalItem.lastRecurredAt = new Date();
    await this.shoppingItemRepository.save(originalItem);
  }

  private async checkForSimilarRecurringItems(houseId: string, newItemName: string): Promise<string[]> {
    const warnings: string[] = [];
    const shoppingList = await this.shoppingListRepository.findOne({
      where: { primaryForHouse: { id: houseId } }
    });

    if (!shoppingList) return warnings;

    // Find recent recurring items that might be similar
    const recentRecurringItems = await this.shoppingItemRepository
      .createQueryBuilder('item')
      .where('item.shoppingListId = :listId', { listId: shoppingList.id })
      .andWhere('item.isRecurring = :isRecurring', { isRecurring: true })
      .andWhere('item.purchasedAt IS NOT NULL')
      .andWhere('item.purchasedAt > NOW() - INTERVAL \'14 days\'') // Last 14 days
      .getMany();

    const normalizedNewName = this.normalizeItemName(newItemName);
    
    for (const item of recentRecurringItems) {
      const normalizedExistingName = this.normalizeItemName(item.name);
      
      if (this.areItemNamesSimilar(normalizedNewName, normalizedExistingName)) {
        const daysUntilReturn = this.calculateDaysUntilReturn(item);
        const hasRecurred = item.lastRecurredAt && item.lastRecurredAt >= item.purchasedAt;
        
        if (!hasRecurred && daysUntilReturn > 0) {
          warnings.push(`Similar item "${item.name}" was recently purchased and will return in ${daysUntilReturn} day(s). Add anyway?`);
        }
      }
    }

    return warnings;
  }

  private normalizeItemName(name: string): string {
    return name.toLowerCase().trim().replace(/[^\w\s]/g, '');
  }

  private areItemNamesSimilar(name1: string, name2: string): boolean {
    // Simple substring matching - can be enhanced later
    if (name1.length < 3 || name2.length < 3) return name1 === name2;
    
    // Check if either contains the other (handles "milk" vs "milk 2%")
    return name1.includes(name2) || name2.includes(name1);
  }

  private calculateDaysUntilReturn(item: ShoppingItem): number {
    if (!item.purchasedAt || !item.recurringInterval) return 0;

    const purchaseDate = new Date(item.purchasedAt);
    const returnDate = new Date(purchaseDate.getTime() + item.recurringInterval * 24 * 60 * 60 * 1000);
    const now = new Date();

    const diffTime = returnDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  private enhanceItemUserObjects(item: ShoppingItem, membersMap: Map<string, any>): ShoppingItem {
    return {
      ...item,
      assignedTo: item.assignedTo ? this.houseMembersService.enhanceUserObject(item.assignedTo, membersMap) : null,
      purchasedBy: item.purchasedBy ? this.houseMembersService.enhanceUserObject(item.purchasedBy, membersMap) : null,
    };
  }

  private async verifyHouseMembership(userId: string, houseId: string): Promise<void> {
    const membership = await this.houseMembershipRepository.findOne({
      where: { userId, houseId }
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this house');
    }
  }
}