import * as vscode from 'vscode';
import { generateCrud as generateLaravelCrud } from './frameworks/laravel/commands/generateCrud';
import { revertCrud as revertLaravelCrud } from './frameworks/laravel/commands/revertCrud';

export function activate(context: vscode.ExtensionContext) {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    vscode.window.showErrorMessage('Easystructor: No workspace folder found.');
    return;
  }

  registerLaravelCommands(context, workspaceRoot);

  const mainCmd = vscode.commands.registerCommand('easystructor.generateModule', async () => {
    const framework = await vscode.window.showQuickPick(
      ['Laravel', 'NestJS (coming soon)', 'Django (coming soon)'],
      { placeHolder: 'Select the framework to generate module for' }
    );

    if (!framework) return;

    switch (framework) {
      case 'Laravel':
        vscode.commands.executeCommand('easystructor.laravel.generateCrud');
        break;
      default:
        vscode.window.showInformationMessage(`${framework} support is coming soon!`);
    }
  });

  context.subscriptions.push(mainCmd);
}

function registerLaravelCommands(context: vscode.ExtensionContext, root: string) {
  const genCmd = vscode.commands.registerCommand(
    'easystructor.laravel.generateCrud',
    () => generateLaravelCrud(root)
  );

  const revCmd = vscode.commands.registerCommand(
    'easystructor.laravel.revertCrud',
    () => revertLaravelCrud(root)
  );

  context.subscriptions.push(genCmd, revCmd);
}

export function deactivate() { }