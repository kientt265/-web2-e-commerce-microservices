# E-commerce Microservices Monorepo

This project is a comprehensive e-commerce system built with a distributed microservices architecture, now organized as a monorepo. It leverages Kafka as a message broker for inter-service communication, ensuring data consistency and scalability. The system has evolved to include robust logging with the ELK Stack and a highly available API Gateway managed by Nginx.

![Alt text](../web2-e-comerce-microservices/front/public/flow_diagram.png "Tooltip optional")


## Project Overview

This application is composed of several microservices, each responsible for a specific business domain, along with infrastructure components for logging and API management:

*   **User Service:** Manages user information, authentication, and authorization.
*   **Product Service:** Handles product information, categories, and inventory.
*   **Cart Service:** Manages temporary shopping carts using Redis for high-speed data access.
*   **Order Service:** Processes orders, manages payment flows, and tracks order history.
*   **Payment Service:** Integrates with VNPay for secure and efficient payment processing.
*   **Search Service:** Utilizes Elasticsearch for fast and efficient product search capabilities.
*   **Mail Service:** Sends email notifications to users, particularly for new order confirmations, using SMTP.
*   **API Gateway:** A central entry point for all client requests, routing them to the appropriate microservices. Managed by multiple instances for high availability.
*   **Nginx Load Balancer:** Distributes incoming traffic across multiple API Gateway instances, ensuring high availability and fault tolerance.
*   **ELK Stack (Elasticsearch, Logstash, Kibana):** A powerful suite for centralized logging, enabling efficient collection, parsing, storage, and visualization of logs from all microservices.

## Technologies Used

This project incorporates a variety of modern technologies to ensure robustness, scalability, performance, and observability:

*   **Languages:** Node.js (TypeScript), Python
*   **Frameworks:** Express (for Node.js services), FastAPI (for Python services)
*   **Databases:** PostgreSQL (for persistent data storage), Redis (for caching and temporary data like shopping carts)
*   **Message Broker:** Apache Kafka (for asynchronous communication and event streaming)
*   **Change Data Capture (CDC):** Debezium (for capturing row-level changes in databases and streaming them to Kafka)
*   **Search Engine:** Elasticsearch (for full-text search and analytics on product data)
*   **Payment Gateway:** VNPay (a popular payment solution in Vietnam)
*   **Email Protocol:** SMTP (for sending transactional emails)
*   **API Gateway:** (Specific technology if known, otherwise generic term)
*   **Load Balancer:** Nginx
*   **Logging & Monitoring:** Elasticsearch, Logstash, Kibana (ELK Stack)
*   **Containerization:** Docker, Docker Compose (for defining and running multi-container Docker applications)

## Architecture Diagram

(An updated architecture diagram illustrating the microservices, their interactions, data flows, the API Gateway with Nginx Load Balancer, and the ELK Stack for centralized logging would be placed here. This would typically show Kafka as the central message bus, with services communicating through it, and separate databases for each service where applicable, along with Elasticsearch, Redis, Mail Service, and the new infrastructure components.)

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

The repository is organized as a monorepo, with several top-level directories representing different components of the system:

```
-web2-e-commerce-microservices-monorepo/
├── back/                         # Contains backend microservices (e.g., User, Product, Order, Cart, Payment, Mail)
│   ├── src/
│   └── ...
├── front/                        # Frontend application (e.g., React, Angular, Vue.js)
│   ├── src/
│   └── ...
├── devops/                       # Contains infrastructure configurations (e.g., Nginx, ELK Stack)
│   ├── nginx/                    # Nginx configurations for API Gateway load balancing
│   ├── elk/                      # ELK Stack configurations (Logstash pipelines, Kibana dashboards)
│   └── ...
├── docker-compose.yml            # Main Docker Compose configuration for all services and infrastructure
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
git clone https://github.com/kientt265/-web2-e-commerce-microservices-monorepo.git
cd -web2-e-commerce-microservices-monorepo
```

### 2. Build and Start the Services

Navigate to the project root directory and use Docker Compose to build and start all defined services and infrastructure components. This command will pull necessary images, build custom service images, and start all containers in detached mode.

```shell
docker-compose up --build -d
```

*   `--build`: Rebuilds service images (e.g., for `back`, `front`, `api-gateway`, `logstash` services) from their respective Dockerfiles.
*   `-d`: Runs containers in detached mode, allowing them to run in the background.

This process will:

*   Pull images for PostgreSQL, Kafka, Zookeeper, Elasticsearch, Redis, Debezium, Nginx, Logstash, and Kibana.
*   Build custom images for your Node.js/TypeScript and Python microservices, as well as any custom API Gateway or logging components.
*   Start all containers and connect them via a Docker network.

### 3. Create Kafka Topics

After the services are up, you need to create the necessary Kafka topics for inter-service communication. A convenience script `create-topics.sh` is provided for this purpose:

```shell
./create-topics.sh
```

This script typically contains commands to create topics such as `product-events`, `order-events`, `payment-events`, `cart-events`, `mail-events`, and potentially `log-events` if logs are streamed to Kafka before Logstash.

### 4. Verify Services

To ensure all services and infrastructure components are running correctly, you can check the status of your Docker containers:

```shell
docker ps
```

You should see a list of running containers, including those for PostgreSQL, Kafka, Zookeeper, Elasticsearch, Redis, Debezium, Nginx, Logstash, Kibana, and your custom microservices (e.g., `user-service`, `product-service`, `cart-service`, `order-service`, `payment-service`, `search-service`, `mail-service`, `api-gateway`).

To view logs for a specific service (e.g., `product-service`):

```shell
docker logs <container_name_or_id>
```

Replace `<container_name_or_id>` with the actual name or ID of the service container you want to inspect.

### 5. Access the Application

Once all services are running, you can access the frontend application (if available) via your web browser, typically at `http://localhost:<frontend_port>`. All API requests should now go through the Nginx Load Balancer and API Gateway, usually accessible at `http://localhost:<nginx_port>`.

Kibana dashboard for log visualization will typically be available at `http://localhost:5601`.

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
*   `log-events`: (Optional) For streaming application logs to Logstash.

These topics are created by the `create-topics.sh` script. You can inspect Kafka topics using Kafka command-line tools if needed.

## Debezium (Change Data Capture)

Debezium is configured to capture changes from the PostgreSQL databases (e.g., `products` table in Product Service) and stream these changes as events to Kafka topics. This enables other services, like the Search Service, to react to data changes in real-time.

## Elasticsearch

The Search Service indexes product data into Elasticsearch. This allows for powerful and fast full-text search capabilities, including filtering, sorting, and faceting. The data is kept in sync with the Product Service database via Debezium and Kafka.

## VNPay Integration

The Payment Service integrates with VNPay, a popular payment gateway. This integration handles the secure redirection of users to the VNPay portal for payment, and processes the callback from VNPay to update order statuses.

## Mail Service

The Mail Service is responsible for sending email notifications to users. It listens for specific events on Kafka (e.g., `order-events` for new order confirmations) and uses SMTP to send out emails. This ensures users receive timely updates regarding their interactions with the e-commerce system.

## ELK Stack for Centralized Logging

The ELK Stack (Elasticsearch, Logstash, Kibana) is integrated for comprehensive log management and analysis:

*   **Logstash:** Collects logs from all microservices, parses them, and transforms them into a structured format before sending them to Elasticsearch. It can receive logs directly or via Kafka (`log-events` topic).
*   **Elasticsearch:** Stores and indexes the processed logs, making them searchable and analyzable in real-time.
*   **Kibana:** Provides a powerful web interface for visualizing, exploring, and managing the logs stored in Elasticsearch. Custom dashboards can be created to monitor system health, identify issues, and gain insights into application behavior.

This centralized logging solution significantly improves observability and simplifies troubleshooting in a distributed microservices environment.

## API Gateway and Nginx Load Balancer

To manage incoming requests and ensure high availability, the system employs an API Gateway fronted by an Nginx Load Balancer:

*   **API Gateway:** Acts as a single entry point for all external clients. It handles request routing, composition, and protocol translation, abstracting the underlying microservices architecture from the clients. Multiple instances of the API Gateway can be deployed for redundancy.
*   **Nginx Load Balancer:** Sits in front of the API Gateway instances, distributing incoming client requests evenly across them. This provides fault tolerance (if one API Gateway instance fails, Nginx routes traffic to others) and improves overall system performance by preventing any single gateway from becoming a bottleneck. Nginx also handles SSL termination and can provide basic security features.

This setup ensures that the system is robust, scalable, and resilient to failures, providing a seamless experience for end-users.

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

