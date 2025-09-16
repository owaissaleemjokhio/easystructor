"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateValidationRules = generateValidationRules;
exports.writeRequestStub = writeRequestStub;
const fs = require("fs");
const path = require("path");
const fieldParser_1 = require("../utils/fieldParser");
function generateValidationRules(fieldStr) {
    const fields = (0, fieldParser_1.parseFields)(fieldStr);
    const ruleLines = fields.map(field => {
        const key = field.name;
        const rule = field.rules.join('|');
        return `'${key}' => '${rule}',`;
    });
    return `return [\n${ruleLines.join('\n')}\n];`;
}
function writeRequestStub(root, module, rules) {
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
//# sourceMappingURL=requestStub.js.map