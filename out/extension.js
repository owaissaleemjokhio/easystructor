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
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const generateCrud_1 = require("./frameworks/laravel/commands/generateCrud");
const revertCrud_1 = require("./frameworks/laravel/commands/revertCrud");
function activate(context) {
    var _a, _b;
    const workspaceRoot = (_b = (_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.uri.fsPath;
    if (!workspaceRoot) {
        vscode.window.showErrorMessage('Easystructor: No workspace folder found.');
        return;
    }
    const mainCmd = vscode.commands.registerCommand('easystructor.generateModule', () => __awaiter(this, void 0, void 0, function* () {
        const framework = yield vscode.window.showQuickPick(['Laravel', 'NestJS (coming soon)', 'Django (coming soon)'], { placeHolder: 'Select the framework to generate module for' });
        if (!framework)
            return;
        switch (framework) {
            case 'Laravel':
                registerLaravelCommands(context, workspaceRoot);
                vscode.commands.executeCommand('easystructor.laravel.generateCrud');
                break;
            default:
                vscode.window.showInformationMessage(`${framework} support is coming soon!`);
        }
    }));
    context.subscriptions.push(mainCmd);
}
exports.activate = activate;
function registerLaravelCommands(context, root) {
    const genCmd = vscode.commands.registerCommand('easystructor.laravel.generateCrud', () => (0, generateCrud_1.generateCrud)(root));
    const revCmd = vscode.commands.registerCommand('easystructor.laravel.revertCrud', () => (0, revertCrud_1.revertCrud)(root));
    context.subscriptions.push(genCmd, revCmd);
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map