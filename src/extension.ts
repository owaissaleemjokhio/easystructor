import * as vscode from 'vscode';
import { generateCrud as generateLaravelCrud, generateLaravelCrudFromUI } from './frameworks/laravel/commands/generateCrud';
import { revertCrud as revertLaravelCrud } from './frameworks/laravel/commands/revertCrud';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    vscode.window.showErrorMessage('Easystructor: No workspace folder found.');
    return;
  }

  registerLaravelCommands(context, workspaceRoot);
  registerUIModal(context, workspaceRoot);

  const mainCmd = vscode.commands.registerCommand('easystructor.generateModule', async () => {
    const framework = await vscode.window.showQuickPick(
      ['Laravel', 'NestJS (coming soon)', 'Django (coming soon)'],
      { placeHolder: 'Select the framework to generate module for' }
    );

    if (!framework) return;

    switch (framework) {
      case 'Laravel':
        // vscode.commands.executeCommand('easystructor.laravel.generateCrud');
        vscode.commands.executeCommand('easystructor.openModal');
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


function registerUIModal(context: vscode.ExtensionContext, root: string) {
  let disposable = vscode.commands.registerCommand('easystructor.openModal', () => {
    const panel = vscode.window.createWebviewPanel(
      'easystructorModal',
      'Easystructor Modal',
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'src', 'webview'))]
      }
    );

    const htmlPath = path.join(context.extensionPath, 'src', 'webview', 'modal.html');
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');

    const cssPath = vscode.Uri.file(
      path.join(context.extensionPath, 'src', 'webview', 'modal.css')
    );
    const cssUri = panel.webview.asWebviewUri(cssPath);

    htmlContent = htmlContent.replace('modal.css', cssUri.toString());

    panel.webview.html = htmlContent;

    panel.webview.onDidReceiveMessage(
      message => {
        if (message.command === 'close') {
          panel.dispose();
        } else if (message.command === 'generate') {
          const { model, fields } = message.payload;

          generateLaravelCrudFromUI(root, model, fields);
        }
      },
      undefined,
      context.subscriptions
    );
  });

  context.subscriptions.push(disposable);
}

export function deactivate() { }