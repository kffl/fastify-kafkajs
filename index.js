const fastifyPlugin = require('fastify-plugin');
const { Kafka } = require('kafkajs');

const defaultOptions = {
    clientConfig: {
        brokers: ['localhost:9092'],
        clientId: 'fastify-kafkajs'
    },
    consumers: [],
    ignoreOnClose: false
};

async function fastifyKafkaJS(fastify, options) {
    const actualOptions = Object.assign({}, defaultOptions, options);

    const kafka = new Kafka(actualOptions.clientConfig);

    const logger = fastify.log.child({ plugin: 'fastify-kafkajs' });

    const producer = kafka.producer(actualOptions.producerConfig);
    const consumers = [];

    fastify.addHook('onClose', async () => {
        if (!actualOptions.ignoreOnClose) {
            if (consumers.length === 0) {
                logger.info('disconnecting producer');
                await producer.disconnect();
            } else {
                logger.info('disconnecting producer and consumers');
                const promises = consumers.map((c) => c.disconnect());
                promises.push(producer.disconnect());
                await Promise.all(promises);
            }
        }
    });

    logger.info('connecting producer');
    await producer.connect();

    if (actualOptions.consumers.length > 0) {
        logger.info('creating consumers');

        for (const c of actualOptions.consumers) {
            const consumer = kafka.consumer(c.consumerConfig);
            consumers.push(consumer);
        }

        await Promise.all(
            consumers.map(async (c, idx) => {
                logger.debug(`consumer #${idx} connecting`);
                await c.connect();
                logger.debug(`consumer #${idx} subscribing`);
                await c.subscribe(actualOptions.consumers[idx].subscription);
                logger.debug(`consumer #${idx} starting`);
                await c.run(actualOptions.consumers[idx].runConfig);
                logger.debug(`consumer #${idx} started`);
            })
        );
    }

    fastify.decorate('kafka', {
        client: kafka,
        producer,
        consumers
    });
}

module.exports = fastifyPlugin(fastifyKafkaJS, {
    fastify: '>=2.0.0',
    name: 'fastify-kafkajs'
});
