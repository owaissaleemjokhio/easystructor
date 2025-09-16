"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCamel = toCamel;
exports.toSnake = toSnake;
exports.toSnakeWithoutSpaces = toSnakeWithoutSpaces;
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
 * Converts a string (PascalCase, camelCase, kebab-case, space separated)
 * into snake_case.
 *
 * Examples:
 *   toSnake("UserReferral")   => "user_referral"
 *   toSnake("userReferral")   => "user_referral"
 *   toSnake("User Referral")  => "user_referral"
 *   toSnake("user referral")  => "user_referral"
 *   toSnake("user-referral")  => "user_referral"
 */
function toSnakeWithoutSpaces(str) {
    return str
        .replace(/([a-z])([A-Z])/g, "$1_$2") // camelCase / PascalCase → underscore
        .replace(/[\s\-]+/g, "_") // spaces / dashes → underscore
        .replace(/__+/g, "_") // multiple underscores → single
        .toLowerCase()
        .trim();
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