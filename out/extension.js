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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const generateCrud_1 = require("./frameworks/laravel/commands/generateCrud");
const revertCrud_1 = require("./frameworks/laravel/commands/revertCrud");
const fs = require("fs");
const path = require("path");
function activate(context) {
    var _a, _b;
    const workspaceRoot = (_b = (_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.uri.fsPath;
    if (!workspaceRoot) {
        vscode.window.showErrorMessage('Easystructor: No workspace folder found.');
        return;
    }
    registerLaravelCommands(context, workspaceRoot);
    registerUIModal(context, workspaceRoot);
    const mainCmd = vscode.commands.registerCommand('easystructor.generateModule', () => __awaiter(this, void 0, void 0, function* () {
        const framework = yield vscode.window.showQuickPick(['Laravel', 'NestJS (coming soon)', 'Django (coming soon)'], { placeHolder: 'Select the framework to generate module for' });
        if (!framework)
            return;
        switch (framework) {
            case 'Laravel':
                // vscode.commands.executeCommand('easystructor.laravel.generateCrud');
                vscode.commands.executeCommand('easystructor.openModal');
                break;
            default:
                vscode.window.showInformationMessage(`${framework} support is coming soon!`);
        }
    }));
    context.subscriptions.push(mainCmd);
}
function registerLaravelCommands(context, root) {
    const genCmd = vscode.commands.registerCommand('easystructor.laravel.generateCrud', () => (0, generateCrud_1.generateCrud)(root));
    const revCmd = vscode.commands.registerCommand('easystructor.laravel.revertCrud', () => (0, revertCrud_1.revertCrud)(root));
    context.subscriptions.push(genCmd, revCmd);
}
function registerUIModal(context, root) {
    let disposable = vscode.commands.registerCommand('easystructor.openModal', () => {
        const panel = vscode.window.createWebviewPanel('easystructorModal', 'Easystructor Modal', vscode.ViewColumn.Active, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'src/frameworks/laravel', 'webview'))]
        });
        const htmlPath = path.join(context.extensionPath, 'src/frameworks/laravel', 'webview', 'modal.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');
        const cssPath = vscode.Uri.file(path.join(context.extensionPath, 'src/frameworks/laravel', 'webview', 'modal.css'));
        const cssUri = panel.webview.asWebviewUri(cssPath);
        htmlContent = htmlContent.replace('modal.css', cssUri.toString());
        panel.webview.html = htmlContent;
        panel.webview.onDidReceiveMessage(message => {
            if (message.command === 'close') {
                panel.dispose();
            }
            else if (message.command === 'generate') {
                const { model, fields } = message.payload;
                (0, generateCrud_1.generateLaravelCrudFromUI)(root, model, fields);
            }
            else if (message.command === 'revertCrud') {
                const { moduleName } = message.payload;
                (0, revertCrud_1.revertCrud)(root, moduleName);
            }
        }, undefined, context.subscriptions);
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map