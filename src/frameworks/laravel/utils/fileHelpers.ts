import * as fs from 'fs';
import * as path from 'path';
import pluralize = require('pluralize');

/**
 * Safely writes a file stub. Ensures the directory exists before writing.
 * 
 * @param filePath Absolute file path to write.
 * @param content  File content to write.
 */
export function writeStubFile(filePath: string, content: string) {
    try {
        const dir = path.dirname(filePath);

        // Create the directory recursively if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Write content to the file
        fs.writeFileSync(filePath, content, 'utf8');

        console.log(`[✔] Stub written: ${filePath}`);
    } catch (error) {
        console.error(`[✘] Failed to write stub file: ${filePath}`, error);
    }
}


export function getCrudFilePaths(moduleName: string, workspaceRoot: string): string[] {
    const snakeName = moduleName.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    const snake = pluralize(snakeName);

    const paths = [
        `app/Models/${moduleName}.php`,
        `app/Http/Controllers/${moduleName}Controller.php`,
        `app/Http/Requests/${moduleName}Request.php`,
        `app/Services/${moduleName}Service.php`,
        `app/Http/Resources/${moduleName}Resource.php`,
    ];

    const migrationDir = path.join(workspaceRoot, 'database/migrations');
    if (fs.existsSync(migrationDir)) {
        const migrationFiles = fs.readdirSync(migrationDir);
        const migrationMatch = migrationFiles.find(file =>
            file.endsWith(`create_${snake}_table.php`)
        );

        if (migrationMatch) {
            paths.push(`database/migrations/${migrationMatch}`);
        }
    }

    return paths;
}

export function addApiRoute(root: string, routeName: string, controllerName: string) {
    const apiPath = path.join(root, 'routes/api.php');
    const line = `Route::apiResource('${routeName}', ${controllerName}Controller::class);\n`;
    if (fs.existsSync(apiPath)) {
        const content = fs.readFileSync(apiPath, 'utf8');
        if (!content.includes(line)) {
            fs.appendFileSync(apiPath, line);
        }
    }
}

export function removeApiRoute(root: string, routeName: string, controllerName: string): boolean {
    const apiPath = path.join(root, 'routes/api.php');
    const line = `Route::apiResource('${routeName}', ${controllerName}Controller::class);\n`;
    if (fs.existsSync(apiPath)) {
        let content = fs.readFileSync(apiPath, 'utf8');
        if (content.includes(line)) {
            content = content.replace(line, '');
            fs.writeFileSync(apiPath, content);
            return true;
        }
    }
    return false;
}
