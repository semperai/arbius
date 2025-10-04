"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Test setup file
// Configure test environment
var dotenv = require("dotenv");
// Load test environment variables
dotenv.config({ path: '.env.test' });
// Set test timeout
jest.setTimeout(30000);
// Unmock ethers for address validation
jest.unmock('ethers');
// Mock uuid module
jest.mock('uuid', function () { return ({
    v4: jest.fn(function () { return 'test-uuid-' + Math.random().toString(36).substring(7); }),
}); });
// Mock logger module
jest.mock('../src/log', function () { return ({
    log: {
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
    initializeLogger: jest.fn().mockResolvedValue(undefined),
}); });
// Mock console methods to reduce noise in tests
global.console = __assign(__assign({}, console), { log: jest.fn(), debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() });
