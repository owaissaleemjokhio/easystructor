import * as vscode from 'vscode';
import { ensureLaravelProject, generateCrud as generateLaravelCrud, generateLaravelCrudFromUI, isLaravelProject } from './frameworks/laravel/commands/generateCrud';
import { revertCrud as revertLaravelCrud } from './frameworks/laravel/commands/revertCrud';
import * as fs from 'fs';
import * as path from 'path';

class EasystructorProvider implements vscode.TreeDataProvider<TreeItem> {
  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<TreeItem[]> {
    return Promise.resolve([
      new TreeItem("Generate Laravel Module", "easystructor.openModal"),
      // new TreeItem("Settings", "easystructor.openSettings"),
      // new TreeItem("About", "easystructor.openAbout"),

    ]);
  }
}

class TreeItem extends vscode.TreeItem {
  constructor(label: string, commandId?: string) {
    super(label, vscode.TreeItemCollapsibleState.None);

    if (commandId) {
      this.command = {
        command: commandId,
        title: label
      };
    }
  }
}

export function activate(context: vscode.ExtensionContext) {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  const treeDataProvider = new EasystructorProvider();
  vscode.window.registerTreeDataProvider("easystructorView", treeDataProvider);

  // Settings command
  context.subscriptions.push(
    vscode.commands.registerCommand("easystructor.openSettings", () => {
      const panel = vscode.window.createWebviewPanel(
        "easystructorSettings",
        "Easystructor Settings",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );
      panel.webview.html = getSettingsHtml();
    })
  );

  // About command
  context.subscriptions.push(
    vscode.commands.registerCommand("easystructor.openAbout", () => {
      const panel = vscode.window.createWebviewPanel(
        "easystructorAbout",
        "About Easystructor",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );
      panel.webview.html = getAboutHtml();
    })
  );

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

function getGenerateModuleHtml(): string {
  return `
    <html>
      <body style="font-family: sans-serif; padding: 20px;">
        <h2>⚡ Generate Module</h2>
        <p>Here you can configure your module generation.</p>
      </body>
    </html>
  `;
}

function getSettingsHtml(): string {
  return `
    <html>
      <body style="font-family: sans-serif; padding: 20px;">
        <h2>⚙️ Easystructor Settings</h2>
        <label>Default Project Path:</label><br/>
        <input type="text" style="width: 100%; padding: 6px;" placeholder="e.g. D:/laragon/www" /><br/><br/>
        <label>Theme:</label><br/>
        <select style="padding: 6px;">
          <option>Light</option>
          <option>Dark</option>
        </select><br/><br/>
        <button onclick="alert('Settings saved!')" style="padding: 8px 14px; background: #007acc; color: white; border: none; border-radius: 4px;">Save</button>
      </body>
    </html>
  `;
}

function getAboutHtml(): string {
  return `
    <html>
      <body style="font-family: sans-serif; padding: 20px;">
        <h2>📖 About Easystructor</h2>
        <p><b>Version:</b> 1.0.0</p>
        <p>Easystructor is a Laravel CRUD generator built as a VS Code Extension.</p>
        <p>Author: <b>Muhammad Owais</b></p>
        <p>GitHub: <a href="https://github.com/" target="_blank">Click Here</a></p>
      </body>
    </html>
  `;
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
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'src/frameworks/laravel', 'webview'))]
      }
    );

    const htmlPath = path.join(context.extensionPath, 'src/frameworks/laravel', 'webview', 'modal.html');
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // CSS
    const cssPath = vscode.Uri.file(
      path.join(context.extensionPath, 'src/frameworks/laravel', 'webview', 'modal.css')
    );
    const cssUri = panel.webview.asWebviewUri(cssPath);

    htmlContent = htmlContent.replace('modal.css', cssUri.toString());

    // JS
    const jsPath = vscode.Uri.file(
      path.join(context.extensionPath, 'src/frameworks/laravel', 'webview', 'modal.js')
    );
    const jsUri = panel.webview.asWebviewUri(jsPath);
    htmlContent = htmlContent.replace('modal.js', jsUri.toString());

    panel.webview.html = htmlContent;

    panel.webview.onDidReceiveMessage(
      message => {
        if (message.command === 'close') {
          panel.dispose();
        } else if (message.command === 'generate') {
          const { model, fields } = message.payload;

          const ok = isLaravelProject(root);
          if (!ok) {
            panel.webview.postMessage({ command: 'generateResult', success: false, error: 'laravelSetUp' });
            return;
          } else {
            generateLaravelCrudFromUI(root, model, fields);

            panel.webview.postMessage({
              command: 'generateResult',
              success: true,
              data: { moduleName: message.payload.model }
            });
          }

        } else if (message.command === 'laravelCreate') {
          const { title, model, fields } = message.payload;
          const isCompleted = ensureLaravelProject(root, title, model, fields);
          if (!isCompleted) {
            panel.webview.postMessage({
              command: 'generateResult',
              success: false,
              error: 'Something went wrong.'
            });
          }
          panel.webview.postMessage({
            command: 'generateResult',
            success: true,
            data: { moduleName: message.payload.model }
          });

        } else if (message.command === 'revertCrud') {
          const { moduleName } = message.payload;
          revertLaravelCrud(root, moduleName);
        }
      },
      undefined,
      context.subscriptions
    );
  });

  context.subscriptions.push(disposable);
}

export function deactivate() { }