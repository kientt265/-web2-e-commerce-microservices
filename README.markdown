# Chat Application

This is a real-time chat application built using a microservice architecture with Node.js, TypeScript, Kafka, Zookeeper, and PostgreSQL. The application uses Docker to manage services, ensuring easy setup and scalability.

## Project Overview

The application consists of a single microservice (`chat-service`) that handles chat functionality, integrated with Kafka for message streaming and PostgreSQL for persistent storage. Zookeeper is used to manage Kafka's metadata.

### Services
- **chat-service**: A Node.js/Express microservice for handling chat logic, built with TypeScript.
- **postgres**: PostgreSQL database for storing users, conversations, and messages.
- **kafka**: Kafka message broker for real-time message streaming.
- **zookeeper**: Manages Kafka's metadata and coordination.

## Prerequisites

To run this project, ensure you have the following installed:
- **Docker**: Version 20.10 or later.
- **Docker Compose**: Version 2.0 or later.
- **Node.js**: Version 18 (only needed if you want to run the project without Docker for development).
- **npm**: Version 8 or later (for local development).

Verify installation:
```bash
docker --version
docker-compose --version
node --version
npm --version
```

## Project Structure

```
web2-chat-app/
├── back/                     # Chat microservice source code
│   ├── src/
│   │   └── index.ts         # Main entry point for chat-service
│   ├── package.json         # Node.js dependencies and scripts
│   ├── tsconfig.json        # TypeScript configuration
│   └── Dockerfile           # Dockerfile for chat-service
├── docker-compose.yml       # Docker Compose configuration for all services
├── .gitignore               # Git ignore file
└── README.md                # This file
```

## Setup and Running the Project

Follow these steps to start the project using Docker.

### 1. Clone the Repository
Clone the project to your local machine:
```bash
git clone <repository-url>
cd web2-chat-app
```

### 2. Verify Project Files
Ensure the following files exist:
- `docker-compose.yml` in the root directory.
- `back/package.json`, `back/tsconfig.json`, `back/Dockerfile`, and `back/src/index.ts`.

If any file is missing, contact the project owner or refer to the project documentation to restore them.

### 3. Build and Start the Services
Run the following command to build and start all services (`chat-service`, `postgres`, `kafka`, `zookeeper`):
```bash
docker-compose up --build -d
```
- `--build`: Builds the Docker image for `chat-service` from the `Dockerfile`.
- `-d`: Runs containers in detached mode (in the background).

This command will:
- Pull images for `postgres:15`, `confluentinc/cp-zookeeper:7.2.1`, and `confluentinc/cp-kafka:7.2.1`.
- Build the `chat-service` image from the `back` directory.
- Start all containers and connect them via the `chat-network` network.

### 4. Verify Services
Check if all containers are running:
```bash
docker ps
```
You should see four containers:
- `web2-chat-app_chat-service_1`
- `web2-chat-app_postgres_1`
- `web2-chat-app_kafka_1`
- `web2-chat-app_zookeeper_1`

View logs for a specific service (e.g., `chat-service`):
```bash
docker logs web2-chat-app_chat-service_1
```
You should see a message like:
```
Chat Service is running on port 3000
```

### 5. Test the Application
Test the `chat-service` endpoint:
```bash
curl http://localhost:3000
```
Expected response:
```
Chat Service is running
```

### 6. Stopping the Services
To stop and remove all containers:
```bash
docker-compose down
```
To also remove volumes (e.g., PostgreSQL data), add `-v`:
```bash
docker-compose down -v
```
**Note**: Using `-v` will delete the PostgreSQL database, so only use it if you want to reset all data.

## Development Mode (Optional)

If you want to run the `chat-service` locally (without Docker) for development:
1. Navigate to the `back` directory:
   ```bash
   cd back
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run in development mode (auto-restarts on code changes):
   ```bash
   npm run dev
   ```
   This uses `ts-node-dev` to run `src/index.ts` directly.

**Note**: Ensure `postgres`, `kafka`, and `zookeeper` containers are running via `docker-compose up -d` to provide the necessary services.

## Database Schema

The PostgreSQL database (`chatdb`) includes the following tables:
- `users`: Stores user information (user_id, username, email, password_hash).
- `conversations`: Stores chat sessions (private or group).
- `conversation_members`: Links users to conversations.
- `messages`: Stores chat messages.
- `message_deliveries`: Tracks message delivery and read status.

To initialize the database schema:
1. Connect to the PostgreSQL container:
   ```bash
   docker exec -it web2-chat-app_postgres_1 psql -U admin -d chatdb
   ```
2. Run the SQL script to create tables (refer to the project documentation for the SQL script).

## Kafka Configuration

Kafka is used for real-time message streaming. The `chat-messages` topic can be created as follows:
1. Access the Kafka container:
   ```bash
   docker exec -it web2-chat-app_kafka_1 bash
   ```
2. Create the topic:
   ```bash
   kafka-topics.sh --create --topic chat-messages --bootstrap-server kafka:9092 --partitions 1 --replication-factor 1
   ```

## Troubleshooting

- **Error: `npm error code ENOENT` (missing package.json)**:
  - Ensure `back/package.json` exists.
  - Run `npm install` in the `back` directory.
- **Error: `ts-node-dev: not found`**:
  - Install `ts-node-dev`:
    ```bash
    cd back
    npm install --save-dev ts-node-dev
    ```
- **Error: `KAFKA_PROCESS_ROLES is required`**:
  - Ensure Kafka is using `confluentinc/cp-kafka:7.2.1` and Zookeeper is running.
- **Database connection issues**:
  - Verify PostgreSQL is running (`docker ps`) and use the correct credentials (`admin`/`password`).
- **General Docker issues**:
  - Clear unused resources:
    ```bash