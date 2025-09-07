import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Category } from "../entities/category.entity";
import { HouseMembership } from "../entities/house-membership.entity";
import { CreateCategoryDto } from "./dto/create-category.dto";

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(HouseMembership)
    private houseMembershipsRepository: Repository<HouseMembership>
  ) {}

  private async verifyHouseMembership(userId: string, houseId: string) {
    const membership = await this.houseMembershipsRepository.findOne({
      where: { userId, houseId, isActive: true },
    });

    if (!membership) {
      throw new NotFoundException("House not found or you are not a member");
    }

    return membership;
  }

  async createCategory(
    createCategoryDto: CreateCategoryDto,
    userId: string,
    houseId: string
  ) {
    await this.verifyHouseMembership(userId, houseId);

    const category = this.categoriesRepository.create({
      ...createCategoryDto,
      houseId,
    });

    return await this.categoriesRepository.save(category);
  }

  async getHouseCategories(userId: string, houseId: string) {
    await this.verifyHouseMembership(userId, houseId);

    return await this.categoriesRepository.find({
      where: { houseId, isActive: true },
      order: { sortOrder: "ASC", name: "ASC" },
    });
  }

  async updateCategory(
    categoryId: string,
    updateData: Partial<CreateCategoryDto>,
    userId: string
  ) {
    const category = await this.categoriesRepository.findOne({
      where: { id: categoryId },
      relations: ["house"],
    });

    if (!category) {
      throw new NotFoundException("Category not found");
    }

    await this.verifyHouseMembership(userId, category.houseId);

    Object.assign(category, updateData);
    return await this.categoriesRepository.save(category);
  }

  async deleteCategory(categoryId: string, userId: string) {
    const category = await this.categoriesRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException("Category not found");
    }

    await this.verifyHouseMembership(userId, category.houseId);

    // Soft delete
    category.isActive = false;
    return await this.categoriesRepository.save(category);
  }

  async createDefaultCategories(houseId: string) {
    const defaultCategories = [
      { name: "Groceries", color: "#10B981", sortOrder: 1 },
      { name: "Utilities", color: "#F59E0B", sortOrder: 2 },
      { name: "Other", color: "#6B7280", sortOrder: 3 },
    ];

    const categories = defaultCategories.map((cat) =>
      this.categoriesRepository.create({ ...cat, houseId, isDefault: true })
    );

    return await this.categoriesRepository.save(categories);
  }
}
