#!/bin/bash

TOPICS=("product-events" "order-events" "payment-events" "mail-events")

for topic in "${TOPICS[@]}"
do
  echo "🔧 Creating topic: $topic"
  docker exec -it kafka kafka-topics \
    --create \
    --if-not-exists \
    --bootstrap-server localhost:9092 \
    --replication-factor 1 \
    --partitions 3 \
    --topic "$topic"
done

echo "✅ All topics created successfully!"
