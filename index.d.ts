import { FastifyPluginAsync } from 'fastify';
import { Kafka, KafkaConfig, Producer, ProducerConfig } from 'kafkajs';

declare namespace fastifyKafkaJS {
    type FastifyKafkaJSClient = Kafka;
    type FastifyKafkaJSProducer = Producer;

    interface FastifyKafkaJSOptions {
        /**
         * KafkaJS client config
         * @default {
         *   brokers: ['localhost:9092'],
         *   clientId: 'fastify-kafkajs'
         * }
         */
        config?: KafkaConfig;
        /**
         * KafkaJS producer config
         */
        producerConfig?: ProducerConfig;
        /**
         * Ignore the default onClose handled which closes the producer
         * If set to true, you will have to manage closing the producer yourself
         * @default false
         */
        ignoreOnClose?: boolean;
    }
}

declare module 'fastify' {
    interface FastifyInstance {
        kafka: {
            client: fastifyKafkaJS.FastifyKafkaJSClient;
            producer: fastifyKafkaJS.FastifyKafkaJSProducer;
        };
    }
}

declare const fastifyKafkaJS: FastifyPluginAsync<fastifyKafkaJS.FastifyKafkaJSOptions>;

export default fastifyKafkaJS;
