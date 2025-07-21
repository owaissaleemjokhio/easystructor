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
function generateCrud(workspaceRoot) {
    return __awaiter(this, void 0, void 0, function* () {
        const rawInput = yield vscode.window.showInputBox({ prompt: 'Enter Module Name (e.g., Product)' });
        if (!rawInput)
            return;
        const kebabCase = rawInput.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        const moduleName = (0, stringUtils_1.toStudly)(rawInput);
        const options = yield vscode.window.showQuickPick([
            'Full CRUD (Model, Service, Controller, Request, Resource)',
            'Only Model',
            'Only Controller',
            'Only Service',
            'Only Request',
            'Only Resource',
        ], { placeHolder: 'Select component to generate' });
        if (!options)
            return;
        const terminal = vscode.window.createTerminal(`Laravel: ${moduleName}`);
        terminal.show();
        terminal.sendText(`cd ${workspaceRoot}`);
        const sendArtisan = (cmd) => terminal.sendText(`php artisan ${cmd}`);
        switch (options) {
            case 'Full CRUD (Model, Service, Controller, Request, Resource)':
                sendArtisan(`make:model ${moduleName}`);
                sendArtisan(`make:request ${moduleName}Request`);
                sendArtisan(`make:resource ${moduleName}Resource`);
                (0, fileHelpers_1.writeStubFile)(path.join(workspaceRoot, `app/Traits/JsonResponse.php`), (0, jsonResponseStub_1.jsonResponseStub)());
                (0, fileHelpers_1.writeStubFile)(path.join(workspaceRoot, `app/Traits/Media.php`), (0, mediaTraitStub_1.mediaTraitStub)());
                (0, fileHelpers_1.writeStubFile)(path.join(workspaceRoot, `app/Http/Resources/PaginatedCollection.php`), (0, paginatedCollectionStub_1.paginatedCollectionStub)());
                (0, fileHelpers_1.writeStubFile)(path.join(workspaceRoot, `app/Services/${moduleName}Service.php`), (0, serviceStub_1.serviceStub)(moduleName));
                (0, fileHelpers_1.writeStubFile)(path.join(workspaceRoot, `app/Http/Controllers/${moduleName}Controller.php`), (0, controllerStub_1.controllerStub)(moduleName));
                break;
            case 'Only Model':
                sendArtisan(`make:model ${moduleName}`);
                break;
            case 'Only Request':
                sendArtisan(`make:request ${moduleName}Request`);
                break;
            case 'Only Resource':
                sendArtisan(`make:resource ${moduleName}Resource`);
                break;
            case 'Only Service':
                (0, fileHelpers_1.writeStubFile)(path.join(workspaceRoot, `app/Services/${moduleName}Service.php`), (0, serviceStub_1.serviceStub)(moduleName));
                break;
            case 'Only Controller':
                (0, fileHelpers_1.writeStubFile)(path.join(workspaceRoot, `app/Http/Controllers/${moduleName}Controller.php`), (0, controllerStub_1.controllerStub)(moduleName));
                break;
        }
        if (['Full CRUD (Model, Service, Controller, Request, Resource)', 'Only Controller'].includes(options)) {
            (0, fileHelpers_1.addApiRoute)(workspaceRoot, kebabCase, moduleName);
        }
    });
}
exports.generateCrud = generateCrud;
//# sourceMappingURL=generateCrud.js.map