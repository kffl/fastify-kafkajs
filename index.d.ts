import { FastifyPluginAsync } from 'fastify';
import {
    Consumer,
    ConsumerConfig,
    ConsumerRunConfig,
    ConsumerSubscribeTopic,
    ConsumerSubscribeTopics,
    Kafka,
    KafkaConfig,
    Producer,
    ProducerConfig
} from 'kafkajs';

declare namespace fastifyKafkaJS {
    type FastifyKafkaJSClient = Kafka;
    type FastifyKafkaJSProducer = Producer;
    type FastifyKafkaJSConsumer = Consumer;
    type FastifyKafkaJSConsumerDeclaration = {
        consumerConfig: ConsumerConfig;
        subscription: ConsumerSubscribeTopics | ConsumerSubscribeTopic;
        runConfig: ConsumerRunConfig;
    };

    interface FastifyKafkaJSOptions {
        /**
         * KafkaJS client config
         * @default {
         *   brokers: ['localhost:9092'],
         *   clientId: 'fastify-kafkajs'
         * }
         */
        clientConfig?: KafkaConfig;
        /**
         * KafkaJS producer config
         */
        producerConfig?: ProducerConfig;
        /**
         * Array of objects describing consumers
         * @default []
         */
        consumers?: FastifyKafkaJSConsumerDeclaration[];
        /**
         * Ignore the default onClose handled which closes the producer
         * and all consumers. If set to true, you will have to manage
         * closing the producer and the consumers yourself.
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
            consumers: fastifyKafkaJS.FastifyKafkaJSConsumer[];
        };
    }
}

declare const fastifyKafkaJS: FastifyPluginAsync<fastifyKafkaJS.FastifyKafkaJSOptions>;

export default fastifyKafkaJS;
