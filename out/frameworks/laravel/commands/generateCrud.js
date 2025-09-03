"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateValidationRulesFromJson = generateValidationRulesFromJson;
exports.generateLaravelCrudFromUI = generateLaravelCrudFromUI;
exports.autoGit = autoGit;
exports.generateCrud = generateCrud;
const vscode = require("vscode");
const path = require("path");
const fileHelpers_1 = require("../utils/fileHelpers");
const controllerStub_1 = require("../stubs/controllerStub");
const serviceStub_1 = require("../stubs/serviceStub");
const jsonResponseStub_1 = require("../stubs/jsonResponseStub");
const mediaTraitStub_1 = require("../stubs/mediaTraitStub");
const paginatedCollectionStub_1 = require("../stubs/paginatedCollectionStub");
const stringUtils_1 = require("../utils/stringUtils");
const migrationStub_1 = require("../stubs/migrationStub");
const requestStub_1 = require("../stubs/requestStub");
const modelStub_1 = require("../stubs/modelStub");
const fs = require("fs");
const child_process_1 = require("child_process");
function generateValidationRulesFromJson(fields) {
    const ruleLines = fields.map(f => {
        const rules = [];
        if (f.type === 'string')
            rules.push('string');
        if (f.type === 'boolean')
            rules.push('boolean');
        if (f.type === 'enum' && f.enum)
            rules.push(`in:${f.enum.join(',')}`);
        if (!f.nullable)
            rules.push('required');
        return `'${f.name}' => '${rules.join('|')}'`;
    }).join(',\n');
    return `return [\n${ruleLines}\n];`;
}
function generateLaravelCrudFromUI(root, rawModel, fieldObjects) {
    return __awaiter(this, void 0, void 0, function* () {
        const moduleName = (0, stringUtils_1.toStudly)(rawModel);
        const kebabCase = rawModel.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        const snakeCase = (0, stringUtils_1.toSnake)(moduleName);
        const fields = fieldObjects.map(field => {
            var _a;
            let parts = `${field.name}:${field.type}`;
            if (field.nullable)
                parts += ':nullable';
            if (field.default)
                parts += `:default(${field.default})`;
            if (field.type === 'enum' && ((_a = field.enum) === null || _a === void 0 ? void 0 : _a.length))
                parts += `:allowed(${field.enum.join(',')})`;
            return parts;
        }).join(', ');
        const terminal = vscode.window.createTerminal(`Laravel: ${moduleName}`);
        terminal.show();
        terminal.sendText(`cd ${root}`);
        const sendArtisan = (cmd) => terminal.sendText(`php artisan ${cmd}`);
        const failedSteps = [];
        const steps = [
            {
                name: 'Request',
                fn: () => (0, requestStub_1.writeRequestStub)(root, moduleName, generateValidationRulesFromJson(fieldObjects))
            },
            {
                name: 'Traits',
                fn: () => {
                    (0, fileHelpers_1.writeStubFile)(path.join(root, `app/Traits/JsonResponse.php`), (0, jsonResponseStub_1.jsonResponseStub)());
                    (0, fileHelpers_1.writeStubFile)(path.join(root, `app/Traits/Media.php`), (0, mediaTraitStub_1.mediaTraitStub)());
                    (0, fileHelpers_1.writeStubFile)(path.join(root, `app/Http/Resources/PaginatedCollection.php`), (0, paginatedCollectionStub_1.paginatedCollectionStub)());
                }
            },
            {
                name: 'Service',
                fn: () => (0, fileHelpers_1.writeStubFile)(path.join(root, `app/Services/${moduleName}Service.php`), (0, serviceStub_1.serviceStub)(moduleName, fields))
            },
            {
                name: 'Controller',
                fn: () => (0, fileHelpers_1.writeStubFile)(path.join(root, `app/Http/Controllers/${moduleName}Controller.php`), (0, controllerStub_1.controllerStub)(moduleName))
            },
            {
                name: 'Migration',
                fn: () => (0, migrationStub_1.createMigrationFile)(root, snakeCase, fields)
            },
            {
                name: 'Model',
                fn: () => (0, modelStub_1.writeModelStub)(root, moduleName, fields)
            },
            {
                name: 'Resource',
                fn: () => sendArtisan(`make:resource ${moduleName}Resource`)
            },
            {
                name: 'Routes',
                fn: () => (0, fileHelpers_1.addApiRoute)(root, kebabCase, moduleName)
            }
        ];
        for (const step of steps) {
            try {
                step.fn();
            }
            catch (err) {
                failedSteps.push(`${step.name}: ${err.message}`);
            }
        }
        if (failedSteps.length > 0) {
            vscode.window.showErrorMessage(`Some steps failed:\n${failedSteps.join('\n')}`);
        }
        else {
            terminal.sendText(`composer dump-autoload`);
            terminal.sendText(`php artisan optimize:clear`);
            autoGit(moduleName);
            setTimeout(() => {
                vscode.window.showInformationMessage(`CRUD for "${moduleName}" generated successfully.`);
            }, 2000);
        }
    });
}
function runCommand(cmd, cwd) {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(cmd, { cwd }, (error, stdout, stderr) => {
            if (error) {
                reject(stderr || error.message);
            }
            else {
                resolve(stdout.trim());
            }
        });
    });
}
function gitExists() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield runCommand("git --version", process.cwd());
            return true;
        }
        catch (_a) {
            return false;
        }
    });
}
function isRepo(workspacePath) {
    return fs.existsSync(path.join(workspacePath, ".git"));
}
function initRepo(workspacePath) {
    return __awaiter(this, void 0, void 0, function* () {
        yield runCommand("git init", workspacePath);
        yield runCommand("git add .", workspacePath);
        yield runCommand(`git commit -m "chore: initial commit"`, workspacePath);
    });
}
function autoGit(moduleName) {
    return __awaiter(this, void 0, void 0, function* () {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("No workspace folder found.");
            return;
        }
        const workspacePath = workspaceFolders[0].uri.fsPath;
        if (!(yield gitExists())) {
            vscode.window.showErrorMessage("Git not installed. Please install Git.");
            return;
        }
        if (!isRepo(workspacePath)) {
            vscode.window.showInformationMessage("No Git repo found. Initializing one...");
            try {
                yield initRepo(workspacePath);
            }
            catch (err) {
                vscode.window.showErrorMessage(`Failed to initialize repo: ${err}`);
                return;
            }
        }
        const branch = `feature/${moduleName.toLowerCase()}`;
        try {
            // Try to checkout new branch, fallback to existing
            yield runCommand(`git checkout -b ${branch}`, workspacePath).catch(() => __awaiter(this, void 0, void 0, function* () {
                yield runCommand(`git checkout ${branch}`, workspacePath);
            }));
            yield runCommand("git add .", workspacePath);
            // Commit (skip if nothing to commit)
            yield runCommand(`git commit -m "feat: Added ${moduleName} CRUD"`, workspacePath).catch(() => {
                // ignore "nothing to commit"
            });
            // Push (safe with -u origin)
            yield runCommand(`git push -u origin ${branch}`, workspacePath).catch(() => {
                vscode.window.showWarningMessage(`Branch "${branch}" created locally but push failed (no remote?).`);
            });
            vscode.window.showInformationMessage(`Git: CRUD for "${moduleName}" committed to branch "${branch}".`);
        }
        catch (err) {
            vscode.window.showErrorMessage(`Git error: ${err}`);
        }
    });
}
function generateCrud(workspaceRoot) {
    return __awaiter(this, void 0, void 0, function* () {
        const rawInput = yield vscode.window.showInputBox({ prompt: 'Enter Module Name (e.g., Product)' });
        if (!rawInput)
            return;
        const kebabCase = rawInput.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        const moduleName = (0, stringUtils_1.toStudly)(rawInput);
        const snakeCase = (0, stringUtils_1.toSnake)(moduleName);
        const options = yield vscode.window.showQuickPick([
            'Full CRUD (Model, Service, Controller, Request, Resource)',
            'Only Model',
            'Only Controller',
            'Only Request',
            'Only Resource',
        ], { placeHolder: 'Select component to generate' });
        if (!options)
            return;
        if (options == 'Full CRUD (Model, Service, Controller, Request, Resource)') {
            const fields = yield vscode.window.showInputBox({
                prompt: 'Define fields and types (e.g., name:string, status:boolean:nullable:default(false), type:enum:allowed(active,inactive):default(active))',
                placeHolder: 'name:string, status:boolean:nullable:default(false), type:enum:allowed(active,inactive):default(active)'
            });
            if (!fields) {
                vscode.window.showErrorMessage('Fields input is required.');
                return;
            }
            const terminal = vscode.window.createTerminal(`Laravel: ${moduleName}`);
            terminal.show();
            terminal.sendText(`cd ${workspaceRoot}`);
            const sendArtisan = (cmd) => terminal.sendText(`php artisan ${cmd}`);
            const failedSteps = [];
            const steps = [
                {
                    name: 'Request',
                    fn: () => (0, requestStub_1.writeRequestStub)(workspaceRoot, moduleName, (0, requestStub_1.generateValidationRules)(fields))
                },
                {
                    name: 'Traits',
                    fn: () => {
                        (0, fileHelpers_1.writeStubFile)(path.join(workspaceRoot, `app/Traits/JsonResponse.php`), (0, jsonResponseStub_1.jsonResponseStub)());
                        (0, fileHelpers_1.writeStubFile)(path.join(workspaceRoot, `app/Traits/Media.php`), (0, mediaTraitStub_1.mediaTraitStub)());
                        (0, fileHelpers_1.writeStubFile)(path.join(workspaceRoot, `app/Http/Resources/PaginatedCollection.php`), (0, paginatedCollectionStub_1.paginatedCollectionStub)());
                    }
                },
                {
                    name: 'Service',
                    fn: () => (0, fileHelpers_1.writeStubFile)(path.join(workspaceRoot, `app/Services/${moduleName}Service.php`), (0, serviceStub_1.serviceStub)(moduleName, fields))
                },
                {
                    name: 'Controller',
                    fn: () => (0, fileHelpers_1.writeStubFile)(path.join(workspaceRoot, `app/Http/Controllers/${moduleName}Controller.php`), (0, controllerStub_1.controllerStub)(moduleName))
                },
                {
                    name: 'Migration',
                    fn: () => (0, migrationStub_1.createMigrationFile)(workspaceRoot, snakeCase, fields)
                },
                {
                    name: 'Model',
                    fn: () => (0, modelStub_1.writeModelStub)(workspaceRoot, moduleName, fields)
                },
                {
                    name: 'Resource',
                    fn: () => sendArtisan(`make:resource ${moduleName}Resource`)
                },
                {
                    name: 'Routes',
                    fn: () => (0, fileHelpers_1.addApiRoute)(workspaceRoot, kebabCase, moduleName)
                }
            ];
            for (const step of steps) {
                try {
                    step.fn();
                }
                catch (err) {
                    failedSteps.push(`${step.name}: ${err.message}`);
                }
            }
            if (failedSteps.length > 0) {
                vscode.window.showErrorMessage(`Some steps failed:\n${failedSteps.join('\n')}`);
            }
            else {
                terminal.sendText(`composer dump-autoload`);
                terminal.sendText(`php artisan optimize:clear`);
            }
        }
        else {
            const terminal = vscode.window.createTerminal(`Laravel: ${moduleName}`);
            terminal.show();
            terminal.sendText(`cd ${workspaceRoot}`);
            const sendArtisan = (cmd) => terminal.sendText(`php artisan ${cmd}`);
            // Individual selections
            if (options.includes('Model'))
                sendArtisan(`make:model ${moduleName}`);
            if (options.includes('Request'))
                sendArtisan(`make:request ${moduleName}Request`);
            if (options.includes('Resource'))
                sendArtisan(`make:resource ${moduleName}Resource`);
            if (options.includes('Controller')) {
                (0, fileHelpers_1.writeStubFile)(path.join(workspaceRoot, `app/Http/Controllers/${moduleName}Controller.php`), (0, controllerStub_1.controllerStub)(moduleName));
            }
        }
    });
}
//# sourceMappingURL=generateCrud.js.map