'use strict';

var defined = require('../../third_party/cesium/Source/Core/defined');

function arraysAreEqual(left, right) {
    if (left === right) {
        return true;
    }

    if (!defined(left) || !defined(right) || left.length !== right.length) {
        return false;
    }

    for (var i = 0; i < left.length; ++i) {
        if (left[i] !== right[i]) {
            return false;
        }
    }

    return true;
}

module.exports = arraysAreEqual;
