import { Request, Response, NextFunction } from 'express';

// Validation middleware cho Product
export const validateProduct = (req: Request, res: Response, next: NextFunction) => {
  const { name, price, stock } = req.body;
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Product name is required and must be a non-empty string' });
  }
  
  if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
    return res.status(400).json({ error: 'Price must be a valid positive number' });
  }
  
  if (stock !== undefined && (isNaN(Number(stock)) || Number(stock) < 0)) {
    return res.status(400).json({ error: 'Stock must be a valid non-negative integer' });
  }
  
  if (req.body.category_id !== undefined && isNaN(Number(req.body.category_id))) {
    return res.status(400).json({ error: 'Category ID must be a valid number' });
  }
  
  next();
};

// Validation middleware cho Category
export const validateCategory = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.body;
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Category name is required and must be a non-empty string' });
  }
  
  next();
};

// Validation middleware cho ID parameter
export const validateId = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'Invalid ID parameter' });
  }
  
  next();
};

// Validation middleware cho query parameters
export const validateQueryParams = (req: Request, res: Response, next: NextFunction) => {
  const { page, limit, minPrice, maxPrice } = req.query;
  
  if (page && (isNaN(Number(page)) || Number(page) < 1)) {
    return res.status(400).json({ error: 'Page must be a valid positive integer' });
  }
  
  if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    return res.status(400).json({ error: 'Limit must be between 1 and 100' });
  }
  
  if (minPrice && (isNaN(Number(minPrice)) || Number(minPrice) < 0)) {
    return res.status(400).json({ error: 'Min price must be a valid non-negative number' });
  }
  
  if (maxPrice && (isNaN(Number(maxPrice)) || Number(maxPrice) < 0)) {
    return res.status(400).json({ error: 'Max price must be a valid non-negative number' });
  }
  
  if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
    return res.status(400).json({ error: 'Min price cannot be greater than max price' });
  }
  
  next();
}; 