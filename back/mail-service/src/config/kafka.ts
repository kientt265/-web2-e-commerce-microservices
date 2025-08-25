import {Kafka} from 'kafkajs';
import {config} from 'dotenv';

config();

const kafka = new Kafka({
    clientId: 'mail-service',
    brokers: [process.env.KAFKA_BROKER || 'kafka:9092']
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({groupId: 'mail-group'});