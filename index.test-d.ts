import { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import fastifyKafkaJS from '.';
import { expectAssignable, expectType } from 'tsd';
import { Consumer, Kafka, Producer, ProducerConfig } from 'kafkajs';

const app: FastifyInstance = Fastify();

app.register(fastifyKafkaJS, {
    producerConfig: {}
});

app.after(() => {
    expectAssignable<Producer>(app.kafka.producer);
    expectType<fastifyKafkaJS.FastifyKafkaJSProducer>(app.kafka.producer);

    expectAssignable<Kafka>(app.kafka.client);
    expectType<fastifyKafkaJS.FastifyKafkaJSClient>(app.kafka.client);

    expectAssignable<Consumer[]>(app.kafka.consumers);
    expectType<fastifyKafkaJS.FastifyKafkaJSConsumer[]>(app.kafka.consumers);
});
