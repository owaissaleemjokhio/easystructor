"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFields = parseFields;
function splitFields(input) {
    const fields = [];
    let current = '';
    let depth = 0;
    for (let i = 0; i < input.length; i++) {
        const char = input[i];
        if (char === ',' && depth === 0) {
            fields.push(current.trim());
            current = '';
        }
        else {
            if (char === '(')
                depth++;
            if (char === ')')
                depth--;
            current += char;
        }
    }
    if (current.trim()) {
        fields.push(current.trim());
    }
    return fields;
}
function parseFields(input) {
    return splitFields(input).map(raw => {
        var _a, _b;
        const parts = raw.trim().split(':');
        const name = (_a = parts[0]) === null || _a === void 0 ? void 0 : _a.trim();
        const type = (((_b = parts[1]) === null || _b === void 0 ? void 0 : _b.trim()) || 'string').toLowerCase();
        const options = parts.slice(2);
        let nullable = false;
        let defaultValue;
        let enumValues = [];
        const rules = [];
        options.forEach(option => {
            option = option.trim();
            if (option === 'nullable') {
                nullable = true;
            }
            else if (option.startsWith('default(')) {
                const match = option.match(/^default\((.*?)\)$/);
                if (match) {
                    const val = match[1];
                    if (type === 'boolean') {
                        defaultValue = val === 'true';
                    }
                    else if (['integer', 'bigint', 'float', 'decimal'].includes(type)) {
                        defaultValue = isNaN(Number(val)) ? 0 : parseFloat(val);
                    }
                    else {
                        defaultValue = val;
                    }
                }
            }
            else if (option.startsWith('allowed(')) {
                const match = option.match(/^allowed\((.*?)\)$/);
                if (match) {
                    enumValues = match[1].split(',').map(v => v.trim());
                }
            }
        });
        // Validation rules
        if (nullable) {
            rules.push('nullable');
        }
        else {
            rules.push('required');
        }
        if (type === 'enum') {
            if (!enumValues.length) {
                throw new Error(`Enum field '${name}' must have allowed(...) values.`);
            }
            rules.push(`in:${enumValues.join(',')}`);
        }
        else {
            switch (type) {
                case 'string':
                case 'text':
                    rules.push('string');
                    break;
                case 'boolean':
                    rules.push('boolean');
                    break;
                case 'integer':
                case 'bigint':
                    rules.push('integer');
                    break;
                case 'float':
                case 'decimal':
                    rules.push('numeric');
                    break;
                case 'date':
                case 'datetime':
                    rules.push('date');
                    break;
                default:
                    rules.push('string');
            }
        }
        return {
            name,
            type,
            rules,
            migration: buildMigrationLine(name, type, {
                nullable,
                defaultValue,
                enumValues
            }),
            default: defaultValue,
            nullable,
            enumValues
        };
    });
}
function buildMigrationLine(name, type, opts) {
    var _a;
    let line = `$table`;
    if (type === 'enum') {
        if (!((_a = opts.enumValues) === null || _a === void 0 ? void 0 : _a.length)) {
            throw new Error(`Enum field '${name}' must have allowed(...) values.`);
        }
        const values = opts.enumValues.map(v => `'${v}'`).join(', ');
        line += `->enum('${name}', [${values}])`;
        if (opts.defaultValue !== undefined) {
            line += `->default('${opts.defaultValue}')`;
        }
        if (opts.nullable) {
            line += '->nullable()';
        }
    }
    else {
        line += `->${type}('${name}')`;
        if (opts.nullable) {
            line += '->nullable()';
        }
        if (opts.defaultValue !== undefined) {
            const val = typeof opts.defaultValue === 'boolean' || typeof opts.defaultValue === 'number'
                ? opts.defaultValue
                : `'${opts.defaultValue}'`;
            line += `->default(${val})`;
        }
    }
    return line + ';';
}
//# sourceMappingURL=fieldParser.js.map