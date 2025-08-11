import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { elasticsearchService } from '../services/elasticsearchService';
import { kafkaService } from '../services/kafkaService';

const prisma = new PrismaClient();

// Product Controllers
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, category, search, minPrice, maxPrice, sortBy = 'created_at', sortOrder = 'desc', useElasticsearch = 'false' } = req.query;
    
    // Sử dụng Elasticsearch nếu có search query hoặc được yêu cầu
    if (search || useElasticsearch === 'true') {
      const filters: any = {
        page: Number(page),
        limit: Number(limit)
      };

      if (category) filters.category_id = Number(category);
      if (minPrice) filters.minPrice = Number(minPrice);
      if (maxPrice) filters.maxPrice = Number(maxPrice);

      const searchResult = await elasticsearchService.searchProducts(
        search ? String(search) : '*',
        filters
      );

      return res.json({
        products: searchResult.products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: searchResult.total,
          totalPages: Number(searchResult.total) / Number(limit)
        },
        searchInfo: {
          query: search,
          took: searchResult.took
        }
      });
    }

    // Sử dụng database nếu không có search
    const skip = (Number(page) - 1) * Number(limit);
    
    // Build where clause
    const where: any = {};
    
    if (category) {
      where.category_id = Number(category);
    }
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }
    
    // Build orderBy clause
    const orderBy: any = {};
    orderBy[String(sortBy)] = sortOrder;
    
    const products = await prisma.products.findMany({
      where,
      include: {
        categories: true
      },
      orderBy,
      skip,
      take: Number(limit)
    });
    
    const total = await prisma.products.count({ where });
    
    res.json({
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.products.findUnique({
      where: { id: Number(id) },
      include: {
        categories: true
      }
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, category_id, images, stock } = req.body;
    
    // Validate required fields
    if (!name || !price || stock === undefined) {
      return res.status(400).json({ error: 'Name, price, and stock are required' });
    }
    
    const product = await prisma.products.create({
      data: {
        name,
        description,
        price: Number(price),
        category_id: category_id ? Number(category_id) : null,
        images: images || [],
        stock: Number(stock)
      },
      include: {
        categories: true
      }
    });
    
    // Index to Elasticsearch
    await elasticsearchService.indexProduct(product);
    
    // Send event to Kafka
    await kafkaService.sendMessage('product-events', {
      type: 'PRODUCT_CREATED',
      product: product
    });
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, category_id, images, stock } = req.body;
    
    // Check if product exists
    const existingProduct = await prisma.products.findUnique({
      where: { id: Number(id) }
    });
    
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const updatedProduct = await prisma.products.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        price: price ? Number(price) : undefined,
        category_id: category_id ? Number(category_id) : undefined,
        images,
        stock: stock !== undefined ? Number(stock) : undefined,
        updated_at: new Date()
      },
      include: {
        categories: true
      }
    });
    
    // Update Elasticsearch
    await elasticsearchService.updateProduct(updatedProduct);
    
    // Send event to Kafka
    await kafkaService.sendMessage('product-events', {
      type: 'PRODUCT_UPDATED',
      product: updatedProduct
    });
    
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if product exists
    const existingProduct = await prisma.products.findUnique({
      where: { id: Number(id) }
    });
    
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    await prisma.products.delete({
      where: { id: Number(id) }
    });
    
    // Remove from Elasticsearch
    await elasticsearchService.deleteProduct(Number(id));
    
    // Send event to Kafka
    await kafkaService.sendMessage('product-events', {
      type: 'PRODUCT_DELETED',
      productId: Number(id)
    });
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProductStock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    
    if (stock === undefined) {
      return res.status(400).json({ error: 'Stock is required' });
    }
    
    const updatedProduct = await prisma.products.update({
      where: { id: Number(id) },
      data: {
        stock: Number(stock),
        updated_at: new Date()
      },
      include: {
        categories: true
      }
    });
    
    // Update Elasticsearch
    await elasticsearchService.updateProduct(updatedProduct);
    
    // Send event to Kafka
    await kafkaService.sendMessage('product-events', {
      type: 'PRODUCT_STOCK_UPDATED',
      product: updatedProduct
    });
    
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product stock:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Elasticsearch Search Controllers
export const searchProducts = async (req: Request, res: Response) => {
  try {
    const { q, category, minPrice, maxPrice, page = 1, limit = 10, inStock } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const filters: any = {
      page: Number(page),
      limit: Number(limit)
    };

    if (category) filters.category_id = Number(category);
    if (minPrice) filters.minPrice = Number(minPrice);
    if (maxPrice) filters.maxPrice = Number(maxPrice);
    if (inStock === 'true') filters.inStock = true;

    const searchResult = await elasticsearchService.searchProducts(String(q), filters);
    
    res.json({
      products: searchResult.products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: searchResult.total,
        totalPages: Number(searchResult.total) / Number(limit)
      },
      searchInfo: {
        query: q,
        took: searchResult.took
      }
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const suggestProducts = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const suggestions = await elasticsearchService.suggestProducts(String(q));
    
    res.json({ suggestions });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Category Controllers
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.categories.findMany({
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const category = await prisma.categories.findUnique({
      where: { id: Number(id) },
      include: {
        products: true,
        _count: {
          select: {
            products: true
          }
        }
      }
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const category = await prisma.categories.create({
      data: {
        name,
        description
      }
    });
    
    // Send event to Kafka
    await kafkaService.sendMessage('category-events', {
      type: 'CATEGORY_CREATED',
      category: category
    });
    
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const existingCategory = await prisma.categories.findUnique({
      where: { id: Number(id) }
    });
    
    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const updatedCategory = await prisma.categories.update({
      where: { id: Number(id) },
      data: {
        name,
        description
      }
    });
    
    // Send event to Kafka
    await kafkaService.sendMessage('category-events', {
      type: 'CATEGORY_UPDATED',
      category: updatedCategory
    });
    
    res.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const existingCategory = await prisma.categories.findUnique({
      where: { id: Number(id) }
    });
    
    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Check if category has products
    const productsCount = await prisma.products.count({
      where: { category_id: Number(id) }
    });
    
    if (productsCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with existing products. Please reassign or delete products first.' 
      });
    }
    
    await prisma.categories.delete({
      where: { id: Number(id) }
    });
    
    // Send event to Kafka
    await kafkaService.sendMessage('category-events', {
      type: 'CATEGORY_DELETED',
      categoryId: Number(id)
    });
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
