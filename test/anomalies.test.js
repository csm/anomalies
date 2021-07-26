let anomalies = require('../anomalies');
let assert = require('assert');
let immutable = require('immutable');

describe('isRetriable', function() {
    it('tells if categories are retriable', () => {
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

        assert.strictEqual(anomalies.isRetriable(immutable.Map({category: 'Busy'})), true);
    })
});

describe('toObject', function() {
    it('converts anomalies to objects', function() {
        try {
            anomalies.toObject(42);
            assert.fail();
        } catch (e) {
            assert.ok(true);
        }

        assert.deepStrictEqual(anomalies.toObject({category: 'Fault', data: {error: 'Some Fault'}}),
            {
                category: 'Fault',
                message: undefined,
                retriable: false,
                error: 'Some Fault',
            });

        let anom = immutable.Map({
            category: 'Fault',
            data: {error: 'Some Fault'}
        });
        let obj = immutable.Map({
            category: 'Fault',
            message: undefined,
            retriable: false,
            error: 'Some Fault',
        })
        assert.deepStrictEqual(anomalies.toObject(anom, true).toJS(), obj.toJS());
    });
});

describe('toResponse', function () {
    it('converts anomalies to responses', function() {
        assert.deepStrictEqual(anomalies.toResponse(new Error('some error')), {
            statusCode: 500,
            body: JSON.stringify({
                category: 'Fault',
                message: 'some error',
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

        let anom = immutable.Map({category: 'Busy'});
        let obj = immutable.Map({
            statusCode: 500,
            body: JSON.stringify({
                category: 'Busy',
                message: undefined,
                retriable: true,
            })
        });
        assert.deepStrictEqual(anomalies.toResponse(anom, true).toJS(), obj.toJS());
    });
});

describe('registerReason', function() {
    it('includes custom reason descriptions', function() {
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
});

describe('toAnomaly', function() {
    it('converts values to anomalies', function() {
        assert.deepStrictEqual(anomalies.toAnomaly('anything'), {category: 'Fault'});
        assert.deepStrictEqual(anomalies.toAnomaly(new Error('an error')), {category: 'Fault', message: 'an error'});
        let anom = {
            category: 'Busy',
            message: 'try again later'
        };
        assert.strictEqual(anom, anomalies.toAnomaly(anom));

        anom = immutable.fromJS(anom);
        assert.deepStrictEqual(immutable.is(anom, anomalies.toAnomaly(anom)), true);

        assert.deepStrictEqual(immutable.is(immutable.Map({category: 'Fault'}), anomalies.toAnomaly(immutable.List())), true);
    });
})