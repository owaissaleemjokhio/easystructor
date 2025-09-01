import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getCrudFilePaths, removeApiRoute } from '../utils/fileHelpers';

export async function revertCrud(workspaceRoot: string, moduleName?: string) {
    // const moduleName = await vscode.window.showInputBox({ prompt: 'Enter Module Name to revert (e.g., Product)' });
    // if (!moduleName) return;

    if (!moduleName) {
        moduleName = await vscode.window.showInputBox({ prompt: 'Enter Module Name to revert (e.g., Product)' });
        if (!moduleName) return;
    }

    const kebabCase = moduleName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    // const confirm = await vscode.window.showQuickPick(['Yes', 'No'], {
    //     placeHolder: `Are you sure you want to delete all files related to ${moduleName}?`
    // });
    // if (confirm !== 'Yes') return;

    const deleted: string[] = [];

    const filesToDelete = getCrudFilePaths(moduleName, workspaceRoot);
    filesToDelete.forEach(relPath => {
        const fullPath = path.join(workspaceRoot, relPath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            deleted.push(relPath);
        }
    });

    if (removeApiRoute(workspaceRoot, kebabCase, moduleName)) {
        deleted.push(`Route for ${moduleName}`);
    }

    vscode.window.showInformationMessage(
        deleted.length > 0
            ? `Deleted files:\n${deleted.join('\n')}`
            : `Nothing found to delete for ${moduleName}`
    );
}
