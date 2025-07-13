"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeApiRoute = exports.addApiRoute = exports.getCrudFilePaths = exports.writeStubFile = void 0;
const fs = require("fs");
const path = require("path");
function writeStubFile(filePath, content) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content, 'utf8');
    }
}
exports.writeStubFile = writeStubFile;
function getCrudFilePaths(moduleName) {
    return [
        `app/Models/${moduleName}.php`,
        `app/Http/Controllers/${moduleName}Controller.php`,
        `app/Http/Requests/${moduleName}Request.php`,
        `app/Http/Resources/${moduleName}Resource.php`,
        `app/Services/${moduleName}Service.php`,
    ];
}
exports.getCrudFilePaths = getCrudFilePaths;
function addApiRoute(root, routeName, controllerName) {
    const apiPath = path.join(root, 'routes/api.php');
    const line = `Route::apiResource('${routeName}', ${controllerName}Controller::class);\n`;
    if (fs.existsSync(apiPath)) {
        const content = fs.readFileSync(apiPath, 'utf8');
        if (!content.includes(line)) {
            fs.appendFileSync(apiPath, line);
        }
    }
}
exports.addApiRoute = addApiRoute;
function removeApiRoute(root, routeName, controllerName) {
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
exports.removeApiRoute = removeApiRoute;
//# sourceMappingURL=fileHelpers.js.map