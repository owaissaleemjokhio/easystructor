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
exports.generateCrud = void 0;
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
                setTimeout(() => {
                    vscode.window.showInformationMessage(`Full CRUD for "${moduleName}" generated successfully.`, { modal: true });
                }, 3000);
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
exports.generateCrud = generateCrud;
//# sourceMappingURL=generateCrud.js.map