let anomalies = require('../anomalies');
let assert = require('assert');

describe('isRetriable', function() {
    assert.strictEqual(anomalies.isRetriable('Unavailable'), true);
    assert.strictEqual(anomalies.isRetriable('Interrupted'), true);
    assert.strictEqual(anomalies.isRetriable('Incorrect'), false);
    assert.strictEqual(anomalies.isRetriable('Forbidden'), false);
    assert.strictEqual(anomalies.isRetriable('Unsupported'), false);
    assert.strictEqual(anomalies.isRetriable('NotFound'), false);
    assert.strictEqual(anomalies.isRetriable('Conflict'), false);
    assert.strictEqual(anomalies.isRetriable('Fault'), false);
    assert.strictEqual(anomalies.isRetriable('Busy'), true);

    assert.strictEqual(anomalies.isRetriable({category: 'Busy'}), true);
});

describe('toObject', function() {
    assert.deepStrictEqual(anomalies.toObject({category: 'Fault', data: {error: 'Some Fault'}}),
        {
            category: 'Fault',
            message: undefined,
            retriable: false,
            error: 'Some Fault',
        });
});

describe('toResponse', function () {
    assert.deepStrictEqual(anomalies.toResponse(new Error('some error')), {
        statusCode: 500,
        body: JSON.stringify({
            category: 'Fault',
            message: undefined,
            retriable: false,
        }),
    });

    assert.deepStrictEqual(anomalies.toResponse({category: 'Busy'}),
        {
            statusCode: 500,
            body: JSON.stringify({
                category: 'Busy',
                message: undefined,
                retriable: true,
            })
        }
    );
});

describe('registerReason', function() {
    anomalies.registerReason('CUSTOM_ERROR', 'Something bad happened!');
    assert.deepStrictEqual(anomalies.toObject({category: 'Fault', reason: 'CUSTOM_ERROR'}),
        {
            category: 'Fault',
            message: undefined,
            retriable: false,
            reason: 'CUSTOM_ERROR',
            error: 'Something bad happened!',
        }
    );

    assert.deepStrictEqual(anomalies.toObject({category: 'Fault', reason: 'UNREGISTERED_REASON'}),
        {
            category: 'Fault',
            message: undefined,
            retriable: false,
            reason: 'UNREGISTERED_REASON',
        }
    );
});