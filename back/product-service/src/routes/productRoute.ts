import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  searchProducts,
  suggestProducts,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/productController';
import {
  validateProduct,
  validateCategory,
  validateId,
  validateQueryParams
} from '../middleware/validation';

const router = Router();

// Product Routes
router.get('/products', validateQueryParams, getAllProducts);
router.get('/products/:id', validateId, getProductById);

// CRUD for Admin
router.post('/products', validateProduct, createProduct);
router.put('/products/:id', validateId, validateProduct, updateProduct);
router.delete('/products/:id', validateId, deleteProduct);
router.patch('/products/:id/stock', validateId, updateProductStock);

// Elasticsearch Search Routes
router.get('/search/products', searchProducts);
router.get('/suggest/products', suggestProducts);

// Category Routes
router.get('/categories', getAllCategories);
router.get('/categories/:id', validateId, getCategoryById);

// CRUD for admin
router.post('/categories', validateCategory, createCategory);
router.put('/categories/:id', validateId, validateCategory, updateCategory);
router.delete('/categories/:id', validateId, deleteCategory);

export default router;
