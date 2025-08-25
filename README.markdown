# E-commerce Microservices System

This project is an e-commerce system built with a distributed microservices architecture. It leverages Kafka as a message broker for inter-service communication, ensuring data consistency and scalability. The system has evolved from a chat application, with AI components removed and replaced by e-commerce functionalities.

## Project Overview

The application is composed of several microservices, each responsible for a specific business domain:

*   **User Service:** Manages user information, authentication, and authorization.
*   **Product Service:** Handles product information, categories, and inventory.
*   **Cart Service:** Manages temporary shopping carts using Redis for high-speed data access.
*   **Order Service:** Processes orders, manages payment flows, and tracks order history.
*   **Payment Service:** Integrates with VNPay for secure and efficient payment processing.
*   **Search Service:** Utilizes Elasticsearch for fast and efficient product search capabilities.
*   **Mail Service:** Sends email notifications to users, particularly for new order confirmations, using SMTP.

## Technologies Used

This project incorporates a variety of modern technologies to ensure robustness, scalability, and performance:

*   **Languages:** Node.js (TypeScript), Python
*   **Frameworks:** Express (for Node.js services), FastAPI (for Python services)
*   **Databases:** PostgreSQL (for persistent data storage), Redis (for caching and temporary data like shopping carts)
*   **Message Broker:** Apache Kafka (for asynchronous communication and event streaming)
*   **Change Data Capture (CDC):** Debezium (for capturing row-level changes in databases and streaming them to Kafka)
*   **Search Engine:** Elasticsearch (for full-text search and analytics on product data)
*   **Payment Gateway:** VNPay (a popular payment solution in Vietnam)
*   **Email Protocol:** SMTP (for sending transactional emails)
*   **Containerization:** Docker, Docker Compose (for defining and running multi-container Docker applications)

## Architecture Diagram

(An architecture diagram illustrating the microservices, their interactions, and data flows would be placed here. This would typically show Kafka as the central message bus, with services communicating through it, and separate databases for each service where applicable, along with Elasticsearch, Redis, and the new Mail Service.)

## Prerequisites

To set up and run this project, ensure you have the following installed on your system:

*   **Docker**: Version 20.10 or later.
*   **Docker Compose**: Version 2.0 or later.

Verify your installations by running:

```shell
docker --version
docker-compose --version
```

## Project Structure

The repository is organized into several directories, each representing a microservice or a core component:

```
-web2-e-commerce-microservices/
├── back/                         # Contains backend services (e.g., User, Product, Order, Cart, Payment, Mail)
│   ├── src/
│   │   ├── user/                 # User service logic
│   │   ├── product/              # Product service logic
│   │   ├── cart/                 # Cart service logic
│   │   ├── order/                # Order service logic
│   │   ├── payment/              # Payment service logic
│   │   ├── mail/                 # Mail service logic
│   │   ├── kafka/                # Kafka producer/consumer utilities
│   │   ├── db/                   # Database connection and models
│   │   └── utils/                # Utility functions and helpers
│   ├── package.json              # Node.js dependencies and scripts
│   ├── tsconfig.json             # TypeScript configuration
│   └── Dockerfile                # Dockerfile for Node.js services
├── front/                        # Frontend application (e.g., React, Angular, Vue.js)
│   ├── src/
│   └── ...
├── docker-compose.yml            # Docker Compose configuration for all services
├── create-topics.sh              # Script to create Kafka topics
├── .gitignore                    # Git ignore file
├── README.markdown               # Project documentation
└── ...
```

## Setup and Running the Project

Follow these steps to get the e-commerce microservices system up and running using Docker:

### 1. Clone the Repository

First, clone the project repository to your local machine:

```shell
git clone https://github.com/kientt265/-web2-e-commerce-microservices.git
cd -web2-e-commerce-microservices
```

### 2. Build and Start the Services

Navigate to the project root directory and use Docker Compose to build and start all defined services. This command will pull necessary images, build custom service images, and start all containers in detached mode.

```shell
docker-compose up --build -d
```

*   `--build`: Rebuilds service images (e.g., for `back` and `front` services) from their respective Dockerfiles.
*   `-d`: Runs containers in detached mode, allowing them to run in the background.

This process will:

*   Pull images for PostgreSQL, Kafka, Zookeeper, Elasticsearch, Redis, and Debezium.
*   Build custom images for your Node.js/TypeScript and Python services.
*   Start all containers and connect them via a Docker network.

### 3. Create Kafka Topics

After the services are up, you need to create the necessary Kafka topics for inter-service communication. A convenience script `create-topics.sh` is provided for this purpose:

```shell
./create-topics.sh
```

This script typically contains commands to create topics such as `product-events`, `order-events`, `payment-events`, `cart-events`, `mail-events` etc., which are crucial for the microservices to communicate effectively.

### 4. Verify Services

To ensure all services are running correctly, you can check the status of your Docker containers:

```shell
docker ps
```

You should see a list of running containers, including those for PostgreSQL, Kafka, Zookeeper, Elasticsearch, Redis, Debezium, and your custom microservices (e.g., `user-service`, `product-service`, `cart-service`, `order-service`, `payment-service`, `search-service`, `mail-service`).

To view logs for a specific service (e.g., `product-service`):

```shell
docker logs <container_name_or_id>
```

Replace `<container_name_or_id>` with the actual name or ID of the service container you want to inspect.

### 5. Access the Application

Once all services are running, you can access the frontend application (if available) via your web browser, typically at `http://localhost:<frontend_port>`. Refer to your `docker-compose.yml` or frontend service configuration for the exact port.

API endpoints for individual microservices will also be available, usually at `http://localhost:<service_port>`.

### 6. Stopping the Services

To stop and remove all running containers and their associated networks:

```shell
docker-compose down
```

To also remove volumes (e.g., PostgreSQL data, Elasticsearch data), which will delete all persistent data, add the `-v` flag:

```shell
docker-compose down -v
```

**Note**: Use `-v` with caution, as it will permanently delete all data stored by the services. Only use it if you intend to reset the entire system.

## Database Schema

Each microservice typically manages its own database schema. For example:

*   **User Service Database (PostgreSQL):**
    *   `users`: Stores user profiles (e.g., `user_id`, `username`, `email`, `password_hash`, `address`).
    *   `roles`: Defines user roles and permissions.
*   **Product Service Database (PostgreSQL):**
    *   `products`: Stores product details (e.g., `product_id`, `name`, `description`, `price`, `stock`, `category_id`).
    *   `categories`: Defines product categories.
*   **Order Service Database (PostgreSQL):**
    *   `orders`: Stores order information (e.g., `order_id`, `user_id`, `order_date`, `total_amount`, `status`).
    *   `order_items`: Details of items within an order.

Redis is used for the Cart Service to store temporary shopping cart data, which is typically a key-value store where keys could be `user_id` and values are serialized cart contents.

## Kafka Configuration

Kafka is central to the inter-service communication. Key topics include:

*   `product-events`: For product-related events (e.g., product created, updated, deleted).
*   `order-events`: For order-related events (e.g., order placed, order status updated).
*   `payment-events`: For payment-related events (e.g., payment successful, payment failed).
*   `cart-events`: For shopping cart events (e.g., item added to cart, item removed from cart).
*   `mail-events`: For events triggering email notifications (e.g., new order confirmation).

These topics are created by the `create-topics.sh` script. You can inspect Kafka topics using Kafka command-line tools if needed.

## Debezium (Change Data Capture)

Debezium is configured to capture changes from the PostgreSQL databases (e.g., `products` table in Product Service) and stream these changes as events to Kafka topics. This enables other services, like the Search Service, to react to data changes in real-time.

## Elasticsearch

The Search Service indexes product data into Elasticsearch. This allows for powerful and fast full-text search capabilities, including filtering, sorting, and faceting. The data is kept in sync with the Product Service database via Debezium and Kafka.

## VNPay Integration

The Payment Service integrates with VNPay, a popular payment gateway. This integration handles the secure redirection of users to the VNPay portal for payment, and processes the callback from VNPay to update order statuses.

## Mail Service

The Mail Service is responsible for sending email notifications to users. It listens for specific events on Kafka (e.g., `order-events` for new order confirmations) and uses SMTP to send out emails. This ensures users receive timely updates regarding their interactions with the e-commerce system.

## Contributing

Contributions are welcome! If you'd like to contribute to this project, please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and ensure they adhere to the project's coding standards.
4.  Write clear and concise commit messages.
5.  Push your changes to your forked repository.
6.  Submit a pull request to the `master` branch of this repository.

## License

(Add license information here, e.g., MIT License, Apache 2.0 License, etc.)

## Acknowledgements

(Optional: Acknowledge any libraries, tools, or individuals that have significantly contributed to the project.)


