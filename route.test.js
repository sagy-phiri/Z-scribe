const request = require('supertest');
const app = require('../../../app'); // Adjust the path to your app

describe('Check Answer Route', () => {
    test('should return correct response for valid input', async () => {
        const response = await request(app).post('/check-answer').send({ answer: '42' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ correct: true });
    });

    test('should return incorrect response for invalid input', async () => {
        const response = await request(app).post('/check-answer').send({ answer: 'wrong' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ correct: false });
    });
});