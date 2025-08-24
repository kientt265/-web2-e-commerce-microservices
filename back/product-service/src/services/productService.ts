import { PrismaClient } from '@prisma/client';
import { elasticsearchService } from './elasticsearchService';
import { kafkaService } from './kafkaServiceElastic';

const prisma = new PrismaClient();

class ProductServiceError extends Error {
    constructor(message: string, public code: string, public statusCode: number = 500) {
        super(message);
        this.name = 'ProductServiceError';
    }
}

export const getProductByIdService = async (id: string) => {
    try {
        if (!id) {
            throw new ProductServiceError('ID is required', 'INVALID_INPUT', 400);
        }

        const product = await prisma.products.findUnique({
            where: { id: Number(id) },
            include: {
                categories: true
            }
        });

        if (!product) {
            throw new ProductServiceError('Product not found', 'NOT_FOUND', 404);
        }

        return product;
    } catch (error) {
        if (error instanceof ProductServiceError) {
            throw error;
        }
        throw new ProductServiceError(
            'Failed to get product: ' + (error as Error).message,
            'DATABASE_ERROR'
        );
    }
};

export const getAllProductsService = async (params: any) => {
    try {
        const { page = 1, limit = 10, category, search, minPrice, maxPrice, sortBy = 'created_at', sortOrder = 'desc', useElasticsearch = 'false' } = params;

        if (Number(page) < 1 || Number(limit) < 1) {
            throw new ProductServiceError('Invalid pagination parameters', 'INVALID_INPUT', 400);
        }

        if (search || useElasticsearch === 'true') {
            try {
                const filters: any = {
                    page: Number(page),
                    limit: Number(limit)
                };

                if (category) filters.category_id = Number(category);
                if (minPrice) filters.minPrice = Number(minPrice);
                if (maxPrice) filters.maxPrice = Number(maxPrice);

                return await elasticsearchService.searchProducts(
                    search ? String(search) : '*',
                    filters
                );
            } catch (error) {
                throw new ProductServiceError(
                    'Elasticsearch search failed: ' + (error as Error).message,
                    'SEARCH_ERROR'
                );
            }
        }

        const skip = (Number(page) - 1) * Number(limit);
        const where: any = {};
        
        if (category) {
            where.category_id = Number(category);
        }
        
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = Number(minPrice);
            if (maxPrice) where.price.lte = Number(maxPrice);
        }
        
        const orderBy: any = {};
        orderBy[String(sortBy)] = sortOrder;
        
        const [products, total] = await Promise.all([
            prisma.products.findMany({
                where,
                include: {
                    categories: true
                },
                orderBy,
                skip,
                take: Number(limit)
            }),
            prisma.products.count({ where })
        ]).catch(error => {
            throw new ProductServiceError(
                'Database query failed: ' + error.message,
                'DATABASE_ERROR'
            );
        });

        return {
            products,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit))
            }
        };
    } catch (error) {
        if (error instanceof ProductServiceError) {
            throw error;
        }
        throw new ProductServiceError(
            'Failed to get products: ' + (error as Error).message,
            'SERVICE_ERROR'
        );
    }
};

export const createProductService = async (productData: any) => {
    try {
        if (!productData.name || !productData.price || productData.stock === undefined) {
            throw new ProductServiceError(
                'Name, price, and stock are required',
                'INVALID_INPUT',
                400
            );
        }

        const product = await prisma.products.create({
            data: {
                name: productData.name,
                description: productData.description,
                price: Number(productData.price),
                category_id: productData.category_id ? Number(productData.category_id) : null,
                images: productData.images || [],
                stock: Number(productData.stock)
            },
            include: {
                categories: true
            }
        });

        await Promise.all([
            elasticsearchService.indexProduct(product),
            kafkaService.sendMessage('product-events', {
                type: 'PRODUCT_CREATED',
                product: product
            })
        ]).catch(error => {
            throw new ProductServiceError(
                'Failed to index product or send event: ' + error.message,
                'INTEGRATION_ERROR'
            );
        });

        return product;
    } catch (error) {
        if (error instanceof ProductServiceError) {
            throw error;
        }
        throw new ProductServiceError(
            'Failed to create product: ' + (error as Error).message,
            'SERVICE_ERROR'
        );
    }
};

export const updateProductService = async (id: string, productData: any) => {
    const updatedProduct = await prisma.products.update({
        where: { id: Number(id) },
        data: {
            name: productData.name,
            description: productData.description,
            price: productData.price ? Number(productData.price) : undefined,
            category_id: productData.category_id ? Number(productData.category_id) : undefined,
            images: productData.images,
            stock: productData.stock !== undefined ? Number(productData.stock) : undefined,
            updated_at: new Date()
        },
        include: {
            categories: true
        }
    });

    await Promise.all([
        elasticsearchService.updateProduct(updatedProduct),
        kafkaService.sendMessage('product-events', {
            type: 'PRODUCT_UPDATED',
            product: updatedProduct
        })
    ]);

    return updatedProduct;
};

export const deleteProductService = async (id: string) => {
    await prisma.products.delete({
        where: { id: Number(id) }
    });

    await Promise.all([
        elasticsearchService.deleteProduct(Number(id)),
        kafkaService.sendMessage('product-events', {
            type: 'PRODUCT_DELETED',
            productId: Number(id)
        })
    ]);
};

export const updateProductStockService = async (id: string, stock: number) => {
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

    await Promise.all([
        elasticsearchService.updateProduct(updatedProduct),
        kafkaService.sendMessage('product-events', {
            type: 'PRODUCT_STOCK_UPDATED',
            product: updatedProduct
        })
    ]);

    return updatedProduct;
};

export const searchProductsService = async (params: any) => {
    const { q, category, minPrice, maxPrice, page = 1, limit = 10, inStock } = params;
    
    const filters: any = {
        page: Number(page),
        limit: Number(limit)
    };

    if (category) filters.category_id = Number(category);
    if (minPrice) filters.minPrice = Number(minPrice);
    if (maxPrice) filters.maxPrice = Number(maxPrice);
    if (inStock === 'true') filters.inStock = true;

    return await elasticsearchService.searchProducts(String(q), filters);
};

export const suggestProductsService = async (query: string) => {
    return await elasticsearchService.suggestProducts(query);
};

export const getAllCategoriesService = async () => {
    const categories = await prisma.categories.findMany({
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      });
    return categories
}

export const getCategoryByIdService = async (id: string) => {
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
      return category;
}

export const createCategoryService = async (name: string, description: string) => {
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
}

export const updateCategoryService = async(id: string, name: string, description: string) => {
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

      return updatedCategory;
}

export const deleteCategoryService = async(id: string) => {
     await prisma.categories.delete({
        where: { id: Number(id) }
      });
      
      // Send event to Kafka
    await kafkaService.sendMessage('category-events', {
        type: 'CATEGORY_DELETED',
        categoryId: Number(id)
      });

}