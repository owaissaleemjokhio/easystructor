import * as fs from 'fs';
import * as path from 'path';

export function writeStubFile(filePath: string, content: string) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

export function getCrudFilePaths(moduleName: string): string[] {
    return [
        `app/Models/${moduleName}.php`,
        `app/Http/Controllers/${moduleName}Controller.php`,
        `app/Http/Requests/${moduleName}Request.php`,
        `app/Http/Resources/${moduleName}Resource.php`,
        `app/Services/${moduleName}Service.php`,
    ];
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
