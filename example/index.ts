import { randomUUID } from 'crypto';
import fastify from 'fastify';
import fastifyGracefulShutdown from 'fastify-graceful-shutdown';
import fastifyKafkaJS from 'fastify-kafkajs';

const server = fastify({ logger: true });

server.register(fastifyGracefulShutdown);

server.register(fastifyKafkaJS, {
    clientConfig: {
        brokers: ['localhost:9092'],
        clientId: 'demo-app'
    },
    consumers: [
        {
            consumerConfig: {
                groupId: 'example-consumer-group'
            },
            subscription: {
                topics: ['test-topic'],
                fromBeginning: false
            },
            runConfig: {
                eachMessage: async ({ message }) => {
                    console.log(`Consumed message: ${message.value}`);
                }
            }
        }
    ]
});

server.post('/produce', async (request, reply) => {
    return server.kafka.producer.send({
        topic: 'test-topic',
        messages: [{ key: 'key1', value: randomUUID() }]
    });
});

server.listen(8080, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at ${address}`);
});
