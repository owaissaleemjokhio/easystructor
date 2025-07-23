export interface ParsedField {
    name: string;
    type: string;
    rules: string[];
    migration: string;
    default?: string | number | boolean;
    nullable?: boolean;
    enumValues?: string[];
}

function splitFields(input: string): string[] {
    const fields: string[] = [];
    let current = '';
    let depth = 0;

    for (let i = 0; i < input.length; i++) {
        const char = input[i];

        if (char === ',' && depth === 0) {
            fields.push(current.trim());
            current = '';
        } else {
            if (char === '(') depth++;
            if (char === ')') depth--;
            current += char;
        }
    }

    if (current.trim()) {
        fields.push(current.trim());
    }

    return fields;
}

export function parseFields(input: string): ParsedField[] {
    return splitFields(input).map(raw => {
        const parts = raw.trim().split(':');
        const name = parts[0]?.trim();
        const type = (parts[1]?.trim() || 'string').toLowerCase();
        const options = parts.slice(2);

        let nullable = false;
        let defaultValue: string | number | boolean | undefined;
        let enumValues: string[] = [];
        const rules: string[] = [];

        options.forEach(option => {
            option = option.trim();

            if (option === 'nullable') {
                nullable = true;
            } else if (option.startsWith('default(')) {
                const match = option.match(/^default\((.*?)\)$/);
                if (match) {
                    const val = match[1];
                    if (type === 'boolean') {
                        defaultValue = val === 'true';
                    } else if (['integer', 'bigint', 'float', 'decimal'].includes(type)) {
                        defaultValue = isNaN(Number(val)) ? 0 : parseFloat(val);
                    } else {
                        defaultValue = val;
                    }
                }
            } else if (option.startsWith('allowed(')) {
                const match = option.match(/^allowed\((.*?)\)$/);
                if (match) {
                    enumValues = match[1].split(',').map(v => v.trim());
                }
            }
        });

        // Validation rules
        if (nullable) {
            rules.push('nullable');
        } else {
            rules.push('required');
        }

        if (type === 'enum') {
            if (!enumValues.length) {
                throw new Error(`Enum field '${name}' must have allowed(...) values.`);
            }
            rules.push(`in:${enumValues.join(',')}`);
        } else {
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

function buildMigrationLine(
    name: string,
    type: string,
    opts: { nullable?: boolean; defaultValue?: string | number | boolean; enumValues?: string[] }
): string {
    let line = `$table`;

    if (type === 'enum') {
        if (!opts.enumValues?.length) {
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
    } else {
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
