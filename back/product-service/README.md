# Product Service

Microservice quản lý sản phẩm và danh mục cho hệ thống e-commerce.

## Tính năng

### Products
- ✅ Lấy danh sách sản phẩm (có phân trang, tìm kiếm, lọc theo giá, danh mục)
- ✅ Lấy sản phẩm theo ID
- ✅ Tạo sản phẩm mới
- ✅ Cập nhật sản phẩm
- ✅ Xóa sản phẩm
- ✅ Cập nhật số lượng tồn kho

### Categories
- ✅ Lấy danh sách danh mục
- ✅ Lấy danh mục theo ID
- ✅ Tạo danh mục mới
- ✅ Cập nhật danh mục
- ✅ Xóa danh mục (chỉ khi không có sản phẩm nào)

## API Endpoints

### Products
```
GET    /api/v1/products          - Lấy danh sách sản phẩm
GET    /api/v1/products/:id      - Lấy sản phẩm theo ID
POST   /api/v1/products          - Tạo sản phẩm mới
PUT    /api/v1/products/:id      - Cập nhật sản phẩm
DELETE /api/v1/products/:id      - Xóa sản phẩm
PATCH  /api/v1/products/:id/stock - Cập nhật số lượng tồn kho
```

### Categories
```
GET    /api/v1/categories        - Lấy danh sách danh mục
GET    /api/v1/categories/:id    - Lấy danh mục theo ID
POST   /api/v1/categories        - Tạo danh mục mới
PUT    /api/v1/categories/:id    - Cập nhật danh mục
DELETE /api/v1/categories/:id    - Xóa danh mục
```

### Health Check
```
GET    /health                   - Kiểm tra trạng thái service
```

## Query Parameters cho Products

- `page`: Số trang (mặc định: 1)
- `limit`: Số sản phẩm mỗi trang (mặc định: 10)
- `category`: ID danh mục để lọc
- `search`: Từ khóa tìm kiếm (tên hoặc mô tả)
- `minPrice`: Giá tối thiểu
- `maxPrice`: Giá tối đa
- `sortBy`: Sắp xếp theo trường (mặc định: created_at)
- `sortOrder`: Thứ tự sắp xếp (asc/desc, mặc định: desc)

## Cài đặt và chạy

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file .env:
```env
PRODUCT_PORT=3003
DATABASE_URL="postgresql://your_user:your_password@product-db:5432/product_db?schema=public"
NODE_ENV=development
```

3. Chạy Prisma migration:
```bash
npx prisma migrate dev
```

4. Chạy service:
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Database Schema

Service sử dụng PostgreSQL với Prisma ORM. Schema bao gồm:

- **products**: Thông tin sản phẩm (id, name, description, price, stock, images, category_id)
- **categories**: Danh mục sản phẩm (id, name, description)

## Docker

Service có thể chạy trong Docker container:

```bash
docker build -t product-service .
docker run -p 3003:3003 product-service
```

## Tích hợp với Microservices

Service này được thiết kế để tích hợp với:
- **Gateway Service**: Điều hướng request
- **Auth Service**: Xác thực và phân quyền
- **Order Service**: Quản lý đơn hàng
- **Inventory Service**: Quản lý tồn kho 