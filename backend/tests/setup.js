"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const vitest_1 = require("vitest");
dotenv_1.default.config({ path: '.env.test' });
(0, vitest_1.beforeAll)(async () => {
    console.log('🧪 Setting up test environment...');
});
(0, vitest_1.afterAll)(async () => {
    console.log('🧹 Cleaning up test environment...');
});
(0, vitest_1.beforeEach)(async () => {
});
//# sourceMappingURL=setup.js.map