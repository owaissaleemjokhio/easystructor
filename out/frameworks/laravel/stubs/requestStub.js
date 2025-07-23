"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeRequestStub = exports.generateValidationRules = void 0;
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
exports.generateValidationRules = generateValidationRules;
function writeRequestStub(root, module, rules) {
    const dir = path.join(root, 'app/Http/Requests');
    const filePath = path.join(dir, `${module}Request.php`);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
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
exports.writeRequestStub = writeRequestStub;
//# sourceMappingURL=requestStub.js.map