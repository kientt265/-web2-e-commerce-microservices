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
    try {
        if (!id) {
            throw new ProductServiceError('ID is required', 'INVALID_INPUT', 400);
        }

        const existingProduct = await prisma.products.findUnique({
            where: { id: Number(id) }
        });

        if (!existingProduct) {
            throw new ProductServiceError('Product not found', 'NOT_FOUND', 404);
        }

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
        ]).catch(error => {
            throw new ProductServiceError(
                'Failed to update product in search index or send event: ' + error.message,
                'INTEGRATION_ERROR'
            );
        });

        return updatedProduct;
    } catch (error) {
        if (error instanceof ProductServiceError) {
            throw error;
        }
        throw new ProductServiceError(
            'Failed to update product: ' + (error as Error).message,
            'SERVICE_ERROR'
        );
    }
};

export const deleteProductService = async (id: string) => {
    try {
        if (!id) {
            throw new ProductServiceError('ID is required', 'INVALID_INPUT', 400);
        }

        const existingProduct = await prisma.products.findUnique({
            where: { id: Number(id) }
        });

        if (!existingProduct) {
            throw new ProductServiceError('Product not found', 'NOT_FOUND', 404);
        }

        await prisma.products.delete({
            where: { id: Number(id) }
        });

        await Promise.all([
            elasticsearchService.deleteProduct(Number(id)),
            kafkaService.sendMessage('product-events', {
                type: 'PRODUCT_DELETED',
                productId: Number(id)
            })
        ]).catch(error => {
            throw new ProductServiceError(
                'Failed to delete product from search index or send event: ' + error.message,
                'INTEGRATION_ERROR'
            );
        });
    } catch (error) {
        if (error instanceof ProductServiceError) {
            throw error;
        }
        throw new ProductServiceError(
            'Failed to delete product: ' + (error as Error).message,
            'SERVICE_ERROR'
        );
    }
};

export const updateProductStockService = async (id: string, stock: number) => {
    try {
        if (!id) {
            throw new ProductServiceError('ID is required', 'INVALID_INPUT', 400);
        }

        if (stock < 0) {
            throw new ProductServiceError('Stock cannot be negative', 'INVALID_INPUT', 400);
        }

        const existingProduct = await prisma.products.findUnique({
            where: { id: Number(id) }
        });

        if (!existingProduct) {
            throw new ProductServiceError('Product not found', 'NOT_FOUND', 404);
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

        await Promise.all([
            elasticsearchService.updateProduct(updatedProduct),
            kafkaService.sendMessage('product-events', {
                type: 'PRODUCT_STOCK_UPDATED',
                status: 'sucessfully',
                productId: id,
                product: updatedProduct,
                timestamp: new Date().toISOString()
            })
        ]).catch(error => {
            throw new ProductServiceError(
                'Failed to update stock in search index or send event: ' + error.message,
                'INTEGRATION_ERROR'
            );
        });

        return updatedProduct;
    } catch (error: any) {
        await kafkaService.sendMessage('product-events', {
            eventType: 'PRODUCT_STOCK_UPDATE_FAILED',
            status: 'failed',
            productId: id,
            errorCode: 'DB_UPDATE_ERROR',
            errorMessage: error.message,
            timestamp: new Date().toISOString()
        })
        if (error instanceof ProductServiceError) {
            throw error;
        }
        throw new ProductServiceError(
            'Failed to update product stock: ' + (error as Error).message,
            'SERVICE_ERROR'
        );
    }
};

export const searchProductsService = async (params: any) => {
    try {
        const { q, category, minPrice, maxPrice, page = 1, limit = 10, inStock } = params;

        if (!q) {
            throw new ProductServiceError('Search query is required', 'INVALID_INPUT', 400);
        }

        if (Number(page) < 1 || Number(limit) < 1) {
            throw new ProductServiceError('Invalid pagination parameters', 'INVALID_INPUT', 400);
        }

        const filters: any = {
            page: Number(page),
            limit: Number(limit)
        };

        if (category) filters.category_id = Number(category);
        if (minPrice) filters.minPrice = Number(minPrice);
        if (maxPrice) filters.maxPrice = Number(maxPrice);
        if (inStock === 'true') filters.inStock = true;

        return await elasticsearchService.searchProducts(String(q), filters);
    } catch (error) {
        if (error instanceof ProductServiceError) {
            throw error;
        }
        throw new ProductServiceError(
            'Search failed: ' + (error as Error).message,
            'SEARCH_ERROR'
        );
    }
};

export const suggestProductsService = async (query: string) => {
    try {
        if (!query) {
            throw new ProductServiceError('Search query is required', 'INVALID_INPUT', 400);
        }

        return await elasticsearchService.suggestProducts(query);
    } catch (error) {
        if (error instanceof ProductServiceError) {
            throw error;
        }
        throw new ProductServiceError(
            'Suggestion failed: ' + (error as Error).message,
            'SEARCH_ERROR'
        );
    }
};

export const getAllCategoriesService = async () => {
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
        return categories;
    } catch (error) {
        throw new ProductServiceError(
            'Failed to get categories: ' + (error as Error).message,
            'DATABASE_ERROR'
        );
    }
};

export const getCategoryByIdService = async (id: string) => {
    try {
        if (!id) {
            throw new ProductServiceError('ID is required', 'INVALID_INPUT', 400);
        }

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
            throw new ProductServiceError('Category not found', 'NOT_FOUND', 404);
        }

        return category;
    } catch (error) {
        if (error instanceof ProductServiceError) {
            throw error;
        }
        throw new ProductServiceError(
            'Failed to get category: ' + (error as Error).message,
            'DATABASE_ERROR'
        );
    }
};

export const createCategoryService = async (name: string, description: string) => {
    try {
        if (!name) {
            throw new ProductServiceError('Name is required', 'INVALID_INPUT', 400);
        }

        const category = await prisma.categories.create({
            data: {
                name,
                description
            }
        });

        await kafkaService.sendMessage('category-events', {
            type: 'CATEGORY_CREATED',
            category: category
        }).catch(error => {
            throw new ProductServiceError(
                'Failed to send category creation event: ' + error.message,
                'INTEGRATION_ERROR'
            );
        });

        return category;
    } catch (error) {
        if (error instanceof ProductServiceError) {
            throw error;
        }
        throw new ProductServiceError(
            'Failed to create category: ' + (error as Error).message,
            'SERVICE_ERROR'
        );
    }
};

export const updateCategoryService = async (id: string, name: string, description: string) => {
    try {
        if (!id) {
            throw new ProductServiceError('ID is required', 'INVALID_INPUT', 400);
        }

        if (!name) {
            throw new ProductServiceError('Name is required', 'INVALID_INPUT', 400);
        }

        const existingCategory = await prisma.categories.findUnique({
            where: { id: Number(id) }
        });

        if (!existingCategory) {
            throw new ProductServiceError('Category not found', 'NOT_FOUND', 404);
        }

        const updatedCategory = await prisma.categories.update({
            where: { id: Number(id) },
            data: {
                name,
                description
            }
        });

        await kafkaService.sendMessage('category-events', {
            type: 'CATEGORY_UPDATED',
            category: updatedCategory
        }).catch(error => {
            throw new ProductServiceError(
                'Failed to send category update event: ' + error.message,
                'INTEGRATION_ERROR'
            );
        });

        return updatedCategory;
    } catch (error) {
        if (error instanceof ProductServiceError) {
            throw error;
        }
        throw new ProductServiceError(
            'Failed to update category: ' + (error as Error).message,
            'SERVICE_ERROR'
        );
    }
};

export const deleteCategoryService = async (id: string) => {
    try {
        if (!id) {
            throw new ProductServiceError('ID is required', 'INVALID_INPUT', 400);
        }

        const existingCategory = await prisma.categories.findUnique({
            where: { id: Number(id) }
        });

        if (!existingCategory) {
            throw new ProductServiceError('Category not found', 'NOT_FOUND', 404);
        }

        // Kiểm tra xem category có sản phẩm không
        const productsCount = await prisma.products.count({
            where: { category_id: Number(id) }
        });

        if (productsCount > 0) {
            throw new ProductServiceError(
                'Cannot delete category with existing products',
                'INVALID_OPERATION',
                400
            );
        }

        await prisma.categories.delete({
            where: { id: Number(id) }
        });

        await kafkaService.sendMessage('category-events', {
            type: 'CATEGORY_DELETED',
            categoryId: Number(id)
        }).catch(error => {
            throw new ProductServiceError(
                'Failed to send category deletion event: ' + error.message,
                'INTEGRATION_ERROR'
            );
        });
    } catch (error) {
        if (error instanceof ProductServiceError) {
            throw error;
        }
        throw new ProductServiceError(
            'Failed to delete category: ' + (error as Error).message,
            'SERVICE_ERROR'
        );
    }
};