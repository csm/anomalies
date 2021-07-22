# anomalies

This is a simple node.js library inspired by
[Cognitect's Clojure micro-library](https://github.com/cognitect-labs/anomalies).

The idea here is to help you better categorize errors as they occur, and
better report these errors as actionable things to callers of your APIs.
Anomalies are simple objects that have at least a key `category` in it,
and which has a string value of one of the following:

| category | retry | fix | 
| ---- | ---- | --- |
| Unavailable | yes | make sure callee healthy |
| Interrupted | yes | stop interrupting |
| Incorrect | no | fix caller bug |
| Forbidden | no | fix caller creds |
| Unsupported | no | fix caller verb |
| NotFound | no | fix caller noun |
| Conflict | no | coordinate with callee |
| Fault | no | fix callee bug |
| Busy | yes | backoff and retry |

## Anomaly Conversion

You can convert an anomaly to an object, which will flatten out data within
the anomaly, add a retriable flag, and add a description for any custom
reason included in the anomaly.

```
const anomalies = require('anomalies');
let obj = anomalies.toObject({category: 'Busy'});
// returns: { category: "Busy", retriable: true }
```

More useful may be converting an anomaly to an HTTP response, which will
choose a HTTP status code appropriate for the category, and will encode
the object version of the anomaly as JSON and return that as the body of
the response. The responses here are usable for things like AWS API Gateway,
but may be usable for other systems (and, you can change the returned object
however you wish).

```
const anomalies = require('anomalies');
let response = anomalies.toResponse({category: 'Forbidden'});
// returns {statusCode: 403, body: '{"category":"Forbidden","retriable":false}'}
```

You can pass any object to `toObject` and `toResponse`. If the value you pass is
not an anomaly, then it treats it as if you had passed in `{category: 'Fault'}`.

## Custom Reasons

You can register a "reason description" for custom reason codes with this
library:

```
const anomalies = require('anomalies');
anomalies.registerReason('MY_CUSTOM_REASON', 'My custom thing failed');
```

Then if you include a `reason` field in an anomaly, converting that to an object
will include your description and reason:

```
let obj = anomalies.toObject({category: 'Fault', reason: 'MY_CUSTOM_REASON'});
// returns {category: 'Fault', reason: 'MY_CUSTOM_REASON', error: 'My custom thing failed'}
```