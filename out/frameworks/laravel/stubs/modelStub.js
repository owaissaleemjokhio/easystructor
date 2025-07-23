"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeModelStub = void 0;
const fs = require("fs");
const path = require("path");
const fieldParser_1 = require("../utils/fieldParser");
function writeModelStub(root, module, fieldStr) {
    const filePath = path.join(root, 'app/Models', `${module}.php`);
    const fields = (0, fieldParser_1.parseFields)(fieldStr);
    const fillable = fields.map(f => `'${f.name}'`).join(', ');
    const attributes = fields
        .filter(f => f.default !== undefined)
        .map(f => `'${f.name}' => '${f.default}'`)
        .join(',\n        ');
    const model = `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class ${module} extends Model
{
    protected $fillable = [${fillable}];

    protected $attributes = [
        ${attributes}
    ];
}
`;
    fs.writeFileSync(filePath, model);
}
exports.writeModelStub = writeModelStub;
//# sourceMappingURL=modelStub.js.map