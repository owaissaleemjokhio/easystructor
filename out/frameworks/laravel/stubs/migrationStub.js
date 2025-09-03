"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMigrationFile = createMigrationFile;
const fs = require("fs");
const path = require("path");
const pluralize = require("pluralize");
const fieldParser_1 = require("../utils/fieldParser");
function createMigrationFile(root, snakeName, fields) {
    const pluralTable = pluralize(snakeName);
    const now = new Date();
    const pad = (num) => num.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}_${pad(now.getMonth() + 1)}_${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const fileName = `${timestamp}_create_${pluralTable}_table.php`;
    const filePath = path.join(root, 'database/migrations', fileName);
    const parsedFields = (0, fieldParser_1.parseFields)(fields);
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
//# sourceMappingURL=migrationStub.js.map