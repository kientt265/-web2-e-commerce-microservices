# nginx-api-gateway/Dockerfile
FROM nginx:latest

# Xóa cấu hình mặc định của Nginx để tránh xung đột
RUN rm /etc/nginx/conf.d/default.conf

# Sao chép tệp cấu hình tùy chỉnh của bạn vào thư mục conf.d của Nginx
COPY ./conf.d/default.conf /etc/nginx/conf.d/

# Mở cổng mà API Gateway sẽ lắng nghe từ bên ngoài (ví dụ: 80 cho HTTP)
EXPOSE 80

# Lệnh mặc định để chạy Nginx
CMD ["nginx", "-g", "daemon off;"]