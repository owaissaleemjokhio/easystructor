import * as fs from 'fs';
import * as path from 'path';
import { parseFields } from '../utils/fieldParser';

export function generateValidationRules(fieldStr: string): string {
    const fields = parseFields(fieldStr);

    const ruleLines = fields.map(field => {
        const key = field.name;
        const rule = field.rules.join('|');
        return `'${key}' => '${rule}',`;
    });

    return `return [\n${ruleLines.join('\n')}\n];`;
}


export function writeRequestStub(root: string, module: string, rules: string) {
    const dir = path.join(root, 'app/Http/Requests');
    const filePath = path.join(dir, `${module}Request.php`);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
        return;
    }

    // const ruleLines = Object.entries(rules).map(([key, val]) => `'${key}' => '${val}',`);

    const content = `<?php

namespace App\\Http\\Requests;

use Illuminate\\Foundation\\Http\\FormRequest;

class ${module}Request extends FormRequest
{
    public function authorize(): bool {
        return true;
    }

    public function rules(): array {
            ${rules}
    }
}
`;

    fs.writeFileSync(filePath, content);
}
