const Fastify = require('fastify');
const fastifyKafkaJS = require('./index');
const { Kafka } = require('kafkajs');

let app;

beforeAll(async () => {
    const client = new Kafka({
        brokers: ['localhost:9092'],
        clientId: 'test-admin-client'
    });
    const admin = client.admin();

    await admin.connect();

    await admin.createTopics({
        topics: [{ topic: 'test-topic' }, { topic: 'test-topic2' }]
    });

    await admin.disconnect();
});

beforeEach(() => {
    app = Fastify();
});

afterEach(() => {
    app.close();
});

test('default values', (done) => {
    app.register(fastifyKafkaJS).ready((err) => {
        expect(err).toBeUndefined();
        expect(app.kafka).toHaveProperty('client');
        expect(app.kafka).toHaveProperty('producer');
        app.close();
        done();
    });
});

test('invalid broker address', async () => {
    expect.assertions(1);
    await expect(
        app
            .register(fastifyKafkaJS, {
                clientConfig: {
                    brokers: ['nope:9092'],
                    clientId: 'some-client',
                    retry: {
                        retries: 0
                    }
                }
            })
            .ready()
    ).rejects.toThrowError();
    app.close();
});

test('closes the producer when ignoreOnClose is false', (done) => {
    app.register(fastifyKafkaJS, { ignoreOnClose: false }).ready((err) => {
        expect(err).toBeUndefined();
        expect(app.kafka).toHaveProperty('client');
        expect(app.kafka).toHaveProperty('producer');
        let closed = false;
        app.kafka.producer.on('producer.disconnect', () => {
            closed = true;
        });
        app.close().then(() => {
            expect(closed).toEqual(true);
            done();
        });
    });
});

test("doesn't close the producer when ignoreOnClose option is set to true", (done) => {
    app.register(fastifyKafkaJS, { ignoreOnClose: true }).ready((err) => {
        expect(err).toBeUndefined();
        expect(app.kafka).toHaveProperty('client');
        expect(app.kafka).toHaveProperty('producer');
        let closed = false;
        app.kafka.producer.on('producer.disconnect', () => {
            closed = true;
        });
        app.close().then(() => {
            expect(closed).toEqual(false);
            app.kafka.producer.disconnect().then(() => {
                expect(closed).toEqual(true);
                done();
            });
        });
    });
});

test('closes the consumer when ignoreOnClose is false', (done) => {
    app.register(fastifyKafkaJS, {
        consumers: [
            {
                consumerConfig: { groupId: 'test-group' },
                subscription: { topics: ['test-topic'], fromBeginning: false },
                runConfig: {
                    eachMessage: async ({ message }) => {
                        console.log(message);
                    }
                }
            }
        ],
        ignoreOnClose: false
    }).ready((err) => {
        expect(err).toBeUndefined();
        expect(app.kafka).toHaveProperty('client');
        expect(app.kafka).toHaveProperty('consumers');
        expect(app.kafka.consumers).toHaveLength(1);
        let closed = false;
        app.kafka.consumers[0].on('consumer.disconnect', () => {
            closed = true;
        });
        app.close().then(() => {
            expect(closed).toEqual(true);
            done();
        });
    });
}, 10000);

test('connects a consumer, sends 3 test messages and consumes them', async () => {
    const mockMessageConsumption = jest.fn();
    await app
        .register(fastifyKafkaJS, {
            producerConfig: {
                allowAutoTopicCreation: true
            },
            consumers: [
                {
                    consumerConfig: {
                        groupId: 'test-group'
                    },
                    subscription: {
                        topics: ['test-topic'],
                        fromBeginning: false
                    },
                    runConfig: {
                        eachMessage: async ({ message }) => {
                            mockMessageConsumption(message);
                        }
                    }
                }
            ]
        })
        .ready();
    expect(app.kafka.consumers).toHaveLength(1);
    await app.kafka.producer.send({
        topic: 'test-topic',
        messages: [
            { key: 'key1', value: 'msg1' },
            { key: 'key1', value: 'msg2' },
            { key: 'key1', value: 'msg3' }
        ]
    });
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await app.close();
    expect(mockMessageConsumption).toHaveBeenCalledTimes(3);
}, 10000);

test('connects 2 consumers, sends 5 messages to 2 separate topics and consumes them', async () => {
    const mockMessageConsumptionOne = jest.fn();
    const mockMessageConsumptionTwo = jest.fn();
    await app
        .register(fastifyKafkaJS, {
            producerConfig: {
                allowAutoTopicCreation: true
            },
            consumers: [
                {
                    consumerConfig: {
                        groupId: 'test-group'
                    },
                    subscription: {
                        topics: ['test-topic'],
                        fromBeginning: false
                    },
                    runConfig: {
                        eachMessage: async ({ message }) => {
                            mockMessageConsumptionOne(message);
                        }
                    }
                },
                {
                    consumerConfig: {
                        groupId: 'test-group2'
                    },
                    subscription: {
                        topics: ['test-topic2'],
                        fromBeginning: false
                    },
                    runConfig: {
                        eachMessage: async ({ message }) => {
                            mockMessageConsumptionTwo(message);
                        }
                    }
                }
            ]
        })
        .ready();
    expect(app.kafka.consumers).toHaveLength(2);
    await app.kafka.producer.send({
        topic: 'test-topic',
        messages: [
            { key: 'key1', value: 'msg1' },
            { key: 'key1', value: 'msg2' },
            { key: 'key1', value: 'msg3' }
        ]
    });
    await app.kafka.producer.send({
        topic: 'test-topic2',
        messages: [
            { key: 'key1', value: 'msg1' },
            { key: 'key1', value: 'msg2' }
        ]
    });
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await app.close();
    expect(mockMessageConsumptionOne).toHaveBeenCalledTimes(3);
    expect(mockMessageConsumptionTwo).toHaveBeenCalledTimes(2);
}, 10000);
