import * as fs from 'fs';
import * as path from 'path';
import { parseFields } from '../utils/fieldParser';

export function writeModelStub(root: string, module: string, fieldStr: string) {
    const filePath = path.join(root, 'app/Models', `${module}.php`);

    const fields = parseFields(fieldStr);
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

    if (fs.existsSync(filePath)) {
        return;
    }

    fs.writeFileSync(filePath, model);
}
