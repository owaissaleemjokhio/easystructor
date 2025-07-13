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
exports.revertCrud = void 0;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const fileHelpers_1 = require("../utils/fileHelpers");
function revertCrud(workspaceRoot) {
    return __awaiter(this, void 0, void 0, function* () {
        const moduleName = yield vscode.window.showInputBox({ prompt: 'Enter Module Name to revert (e.g., Product)' });
        if (!moduleName)
            return;
        const kebabCase = moduleName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        const confirm = yield vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: `Are you sure you want to delete all files related to ${moduleName}?`
        });
        if (confirm !== 'Yes')
            return;
        const deleted = [];
        (0, fileHelpers_1.getCrudFilePaths)(moduleName).forEach(relPath => {
            const fullPath = path.join(workspaceRoot, relPath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                deleted.push(relPath);
            }
        });
        if ((0, fileHelpers_1.removeApiRoute)(workspaceRoot, kebabCase, moduleName)) {
            deleted.push(`Route for ${moduleName}`);
        }
        vscode.window.showInformationMessage(deleted.length > 0
            ? `Deleted files:\n${deleted.join('\n')}`
            : `Nothing found to delete for ${moduleName}`);
    });
}
exports.revertCrud = revertCrud;
//# sourceMappingURL=revertCrud.js.map