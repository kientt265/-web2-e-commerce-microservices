import { Request, Response } from 'express';
import {
    getAllProductsService,
    getProductByIdService,
    createProductService,
    updateProductService,
    deleteProductService,
    updateProductStockService,
    searchProductsService,
    suggestProductsService,
    getAllCategoriesService,
    getCategoryByIdService,
    createCategoryService,
    updateCategoryService,
    deleteCategoryService
} from '../services/productService';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();
// Product Controllers
export const getAllProducts = async (req: Request, res: Response) => {
    try {
        const result = await getAllProductsService(req.query);
        res.json(result);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getProductById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const product = await getProductByIdService(id);

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
        const { name, price, stock } = req.body;

        if (!name || !price || stock === undefined) {
            return res.status(400).json({ error: 'Name, price, and stock are required' });
        }

        const product = await createProductService(req.body);
        res.status(201).json(product);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const existingProduct = await getProductByIdService(id);
        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const updatedProduct = await updateProductService(id, req.body);
        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllCategoriesController = async (req: Request, res: Response) => {
    try {
        const categories = await getAllCategoriesService();
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createCategoryController = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const category = await createCategoryService(name, description);
        res.status(201).json(category);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


export const getCategoryByIdController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const category = await getCategoryByIdService(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json(category);
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteCategoryController = async (req: Request, res: Response) => {
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

        await deleteCategoryService(id);
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateCategoryController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const existingCategory = await prisma.categories.findUnique({
            where: { id: Number(id) }
        });

        if (!existingCategory) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const updatedCategory = updateCategoryService(id, name, description);
        res.json(updatedCategory);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const existingProduct = await getProductByIdService(id);
        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await deleteProductService(id);
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

        const existingProduct = await getProductByIdService(id);
        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const updatedProduct = await updateProductStockService(id, stock);
        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product stock:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Elasticsearch Search Controllers
export const searchProducts = async (req: Request, res: Response) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const searchResult = await searchProductsService(req.query);
        res.json({
            products: searchResult.products,
            pagination: {
                page: Number(req.query.page || 1),
                limit: Number(req.query.limit || 10),
                total: searchResult.total,
                totalPages: Number(searchResult.total) / Number(req.query.limit || 10)
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

        const suggestions = await suggestProductsService(String(q));
        res.json({ suggestions });
    } catch (error) {
        console.error('Error getting suggestions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


