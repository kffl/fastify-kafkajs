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
        done();
    });
});
