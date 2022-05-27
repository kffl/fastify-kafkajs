# Fastify plugin that adds support for KafkaJS - a modern Apache Kafka client

[![CI Workflow](https://github.com/kffl/fastify-kafkajs/actions/workflows/ci.yml/badge.svg)](https://github.com/kffl/fastify-kafkajs/actions/workflows/ci.yml)
[![NPM version](https://img.shields.io/npm/v/fastify-kafkajs.svg?style=flat)](https://www.npmjs.com/package/fastify-kafkajs)
[![NPM downloads](https://img.shields.io/npm/dm/fastify-kafkajs.svg?style=flat)](https://www.npmjs.com/package/fastify-kafkajs)
[![Known Vulnerabilities](https://snyk.io/test/github/kffl/fastify-kafkajs/badge.svg)](https://snyk.io/test/github/kffl/fastify-kafkajs)

**fastify-kafkajs** is a Fastify plugin which adds support for [KafkaJS](https://kafka.js.org/) - a modern Apache Kafka client written in pure JavaScript, without `librdkafka` bindings.

## Features

- Decorates the Fastify instance with `kafka` object exposing a `client` (KafkaJS client instance), `producer` (a single, pre-connected KafkaJS producer) and `consumers` (array of consumers declared in plugin options).
- Disconnects the producer and consumers when the Fastify `onClose` hook is triggered.
- Has 100% test coverage.

## Installation

```
npm install fastify-kafkajs
```

## Usage

```javascript
const app = fastify();

app.register(fastifyKafkaJS, {
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

app.post('/produce', async (request, reply) => {
    return app.kafka.producer.send({
        topic: 'test-topic',
        messages: [{ key: 'key1', value: randomUUID() }]
    });
});
```

A complete example is available in the `example` folder.

### Shutdown behavior

By default, `fastify-kafkajs` disconnects the producer and consumers when the application's `onClose` hook is triggered. You can opt-out of this default behavior by setting the `ignoreOnClose` option to `false`.

In order to ensure that the `onClose` hook is triggered  when the process receives `SIGINT` or `SIGTERM` (thus allowing `fastify-kafkajs` to disconnect the producer and consumers and preventing delayed consumer group re-balancing), usage of [fastify-graceful-shutdown plugin](https://github.com/hemerajs/fastify-graceful-shutdown) is recommended.

```
npm install fastify-graceful-shutdown
```

```typescript
import fastifyGracefulShutdown from 'fastify-graceful-shutdown';

fastify.register(fastifyGracefulShutdown);
```


## Reference

The config object passed as a second parameter passed to register() is optional (since 3 out of 4 keys have default values, and a KafkaJS producer can be initialized with default values when provided with empty config) and has the following schema:

```typescript
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
```

where `FastifyKafkaJSConsumerDeclaration` has the following keys:

- `consumerConfig` - Consumer config passed to `KafkaJS.consumer()` during consumer creation
- `subscription` - parameter passed to `Consumer.subscribe()`
- `runConfig` - config object passed to `Consumer.run()`

Upon being registered, **fastify-kafkajs** decorates the `FastifyInstance` with `kafka` exposing the following keys:

- `client` - a KafkaJS client instance
- `producer` - a single, pre-connected KafkaJS producer (initialized with config specified in `clientConfig` options key)
- `consumers` - array of pre-connected, subscribed and started KafkaJS consumers, declared in `subscribers` options key