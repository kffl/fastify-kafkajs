const Fastfiy = require('fastify');
const fastifyKafkaJS = require('./index');

let app;

beforeEach(() => {
    app = Fastfiy();
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
                config: {
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

test("closes the producer when ignoreOnClose is false", (done) => {
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
                expect(closed).toEqual(true)
                done();
            })
        });
    });
});
