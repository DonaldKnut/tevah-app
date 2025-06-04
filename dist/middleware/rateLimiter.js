"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sensitiveEndpointRateLimiter = exports.authRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.authRateLimiter = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
    ? (_req, _res, next) => next()
    : (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 20,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req, res) => res.status(429).json({
            success: false,
            message: "Too many requests, please try again later",
        }),
    });
exports.sensitiveEndpointRateLimiter = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
    ? (_req, _res, next) => next()
    : (0, express_rate_limit_1.default)({
        windowMs: 60 * 60 * 1000,
        max: 5,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req, res) => res.status(429).json({
            success: false,
            message: "Too many attempts, please try again in an hour",
        }),
    });
