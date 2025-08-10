#!/bin/bash

echo "🔄 Setting up Debezium connector for Product Database..."

# Wait for Kafka Connect to be ready
echo "⏳ Waiting for Kafka Connect to be ready..."
until curl -s http://localhost:8083/connectors > /dev/null; do
  echo "Waiting for Kafka Connect..."
  sleep 5
done

echo "✅ Kafka Connect is ready!"

# Create Debezium connector
echo "🔄 Creating Debezium connector..."
curl -X POST http://localhost:8083/connectors \
  -H "Content-Type: application/json" \
  -d @debezium-connector-config.json

echo "✅ Debezium connector created!"

# Check connector status
echo "📊 Checking connector status..."
curl -s http://localhost:8083/connectors/product-db-connector/status | jq .

echo "🎉 Debezium setup completed!" 