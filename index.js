const fastifyPlugin = require('fastify-plugin');
const { Kafka } = require('kafkajs');

const defaultOptions = {
    config: {
        brokers: ['localhost:9092'],
        clientId: 'fastify-kafkajs'
    },
    ignoreOnClose: false
};

async function fastifyKafkaJS(fastify, options) {
    const actualOptions = Object.assign({}, defaultOptions, options);

    const kafka = new Kafka(actualOptions.config);

    fastify.addHook('onClose', async () => {
        if (!actualOptions.ignoreOnClose) {
            await producer.disconnect();
        }
    });

    const producer = kafka.producer(actualOptions.producerConfig);

    await producer.connect();

    fastify.decorate('kafka', {
        client: kafka,
        producer
    });
}

module.exports = fastifyPlugin(fastifyKafkaJS, {
    fastify: '>=2.0.0',
    name: 'fastify-kafkajs'
});
