// Inspired by Cognitect's anomalies library for Clojure/ClojureScript.
// Purpose is to reify the specification of errors to a standard format,
// with support for returning these errors as meaningful HTTP responses.

// User-supplied reason descriptions.
let descriptions = {};

/**
 * Tell if the given value is retriable.
 * 
 * If the argument is an anomaly, tells if the 'category' of that anomaly is
 * retriable.
 * 
 * Retriable categories are 'Unavailable', 'Interrupted', and 'Busy'.
 * 
 * @param {*} value The value to test.
 * @returns True if the argument is a retriable category or anomaly.
 */
function isRetriable(value) {
    if (isAnomaly(value)) {
        value = value.category;
    }
    return value === 'Unavailable' || value === 'Interrupted' || value === 'Busy';
}

/**
 * Tell if the given value is a category.
 * 
 * @param {String} value 
 * @returns True if the value is a category.
 */
function isCategory(value) {
    return value === 'Unavaliable' 
        || value === 'Interrupted' 
        || value === 'Incorrect' 
        || value === 'Forbidden' 
        || value === 'Unsupported' 
        || value === 'NotFound' 
        || value === 'Conflict' 
        || value === 'Fault' 
        || value === 'Busy';
}

const statusCodes = {
    Unavailable: 503,
    Interrupted: 500,
    Incorrect: 400,
    Forbidden: 403,
    Unsupported: 501,
    NotFound: 404,
    Conflict: 409,
    Fault: 500,
    Busy: 500,
};

/**
 * Tell if a value is an anomaly.
 * 
 * @param {*} value The value to test.
 * @returns True if the argument is an anomaly.
 */
function isAnomaly(value) {
    return value != null && Object.prototype.hasOwnProperty.call(value, 'category') && isCategory(value['category']);
}

/**
 * Convert an anomaly to an object.
 * 
 * This is generally useful for converting an anomaly to a shallow object
 * for returning to the caller of an API.
 * 
 * @param {Object} anomaly 
 * @returns The anomaly object.
 */
function toObject(anomaly) {
    let value = {};
    if (typeof anomaly.data == 'object') {
        value = Object.assign({}, anomaly.data);
    }
    value.category = anomaly.category;
    value.message = anomaly.message;
    value.retriable = isRetriable(anomaly.category);
    if (anomaly.reason != null) {
        value.reason = anomaly.reason;
    }
    if (value.reason != null) {
        let description = descriptions[anomaly.reason];
        if (description != null) {
            value.error = description;
        }
    }
    return value;
}

/**
 * Convert an error object or anomaly to a HTTP response (such as suitable
 * for returning to API Gateway).
 *
 * If the argument is not an anomaly, it will use 'Fault' as the anomaly
 * category.
 * 
 * @param {Object} anomaly The anomaly, or other error object.
 * @returns The HTTP response object.
 */
function toResponse(anomaly) {
    if (!this.isAnomaly(anomaly)) {
        anomaly = {category: 'Fault'};
    }
    return {
        statusCode: statusCodes[anomaly.category],
        body: JSON.stringify(toObject(anomaly))
    };
}

/**
 * Register a new error reason. If you include a 'reason' field in your
 * anomaly, then toObject will also include a key 'error' in the object,
 * which will contain a description (that you supply) of that error.
 * 
 * @param {String} errorCode The error code string.
 * @param {String} errorDescription The error description.
 */
function registerReason(errorCode, errorDescription) {
    descriptions[errorCode] = errorDescription;
}

module.exports = {
    Unavaliable: 'Unavailable',  // Out of Touch
    Interrupted: 'Interrupted',  // It Doesn't Matter Anymore
    Incorrect: 'Incorrect',      // You'll Never Learn
    Forbidden: 'Forbidden',      // I Can't Go For That
    Unsupported: 'Unsupported',  // Your Imagination
    NotFound: 'NotFound',        // She's gone
    Conflict: 'Conflict',        // Give It Up
    Fault: 'Fault',              // Falling
    Busy: 'Busy',                // Wait For Me
    isCategory: isCategory,
    isRetriable: isRetriable,
    isAnomaly: isAnomaly,
    toObject: toObject,
    toResponse: toResponse,
    registerReason: registerReason,
};