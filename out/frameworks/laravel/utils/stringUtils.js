"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCamel = toCamel;
exports.toSnake = toSnake;
exports.toKebab = toKebab;
exports.toStudly = toStudly;
/**
 * Converts a string to camelCase format.
 *
 * Example:
 *   toCamel("UserReferral") => "userReferral"
 */
function toCamel(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}
/**
 * Converts a PascalCase or camelCase string to snake_case.
 *
 * Example:
 *   toSnake("UserReferral") => "user_referral"
 *   toSnake("userReferral") => "user_referral"
 */
function toSnake(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}
/**
 * Converts a PascalCase or camelCase string to kebab-case.
 *
 * Example:
 *   toKebab("UserReferral") => "user-referral"
 *   toKebab("userReferral") => "user-referral"
 */
function toKebab(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
/**
 * Converts a string to PascalCase (also called StudlyCase).
 *
 * Example:
 *   toStudly("user_referral") => "UserReferral"
 *   toStudly("user-referral") => "UserReferral"
 */
function toStudly(str) {
    return str
        .replace(/[_-]+/g, ' ')
        .replace(/(?:^|\s)\S/g, (a) => a.toUpperCase())
        .replace(/\s+/g, '');
}
//# sourceMappingURL=stringUtils.js.map