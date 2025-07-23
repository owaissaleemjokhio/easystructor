import * as fs from 'fs';
import * as path from 'path';
import pluralize = require('pluralize');
import { parseFields } from '../utils/fieldParser';


export function createMigrationFile(root: string, snakeName: string, fields: string) {

    const pluralTable = pluralize(snakeName);

    const now = new Date();
    const pad = (num: number) => num.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}_${pad(now.getMonth() + 1)}_${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    const fileName = `${timestamp}_create_${pluralTable}_table.php`;

    const filePath = path.join(root, 'database/migrations', fileName);

    const parsedFields = parseFields(fields);

    const fieldLines = parsedFields.map(f => `            ${f.migration}`).join('\n');


    const migration = `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('${pluralTable}', function (Blueprint $table) {
            $table->id();
            ${fieldLines}
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('${pluralTable}');
    }
};
`;

    fs.writeFileSync(filePath, migration);
}
