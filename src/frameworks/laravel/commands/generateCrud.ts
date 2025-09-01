import * as vscode from 'vscode';
import * as path from 'path';
import { writeStubFile, addApiRoute } from '../utils/fileHelpers';
import { controllerStub } from '../stubs/controllerStub';
import { serviceStub } from '../stubs/serviceStub';
import { jsonResponseStub } from '../stubs/jsonResponseStub';
import { mediaTraitStub } from '../stubs/mediaTraitStub';
import { paginatedCollectionStub } from '../stubs/paginatedCollectionStub';
import { toSnake, toStudly } from '../utils/stringUtils';
import { createMigrationFile } from '../stubs/migrationStub';
import { writeRequestStub, generateValidationRules } from '../stubs/requestStub';
import { writeModelStub } from '../stubs/modelStub';
import * as fs from "fs";
import { exec } from "child_process";

export function generateValidationRulesFromJson(fields: any[]) {
    const ruleLines = fields.map(f => {
        const rules = [];
        if (f.type === 'string') rules.push('string');
        if (f.type === 'boolean') rules.push('boolean');
        if (f.type === 'enum' && f.enum) rules.push(`in:${f.enum.join(',')}`);
        if (!f.nullable) rules.push('required');
        return `'${f.name}' => '${rules.join('|')}'`;
    }).join(',\n');
    return `return [\n${ruleLines}\n];`;
}

export async function generateLaravelCrudFromUI(root: string, rawModel: string, fieldObjects: any[]) {
    const moduleName = toStudly(rawModel);
    const kebabCase = rawModel.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    const snakeCase = toSnake(moduleName);

    const fields = fieldObjects.map(field => {
        let parts = `${field.name}:${field.type}`;
        if (field.nullable) parts += ':nullable';
        if (field.default) parts += `:default(${field.default})`;
        if (field.type === 'enum' && field.enum?.length) parts += `:allowed(${field.enum.join(',')})`;
        return parts;
    }).join(', ');

    const terminal = vscode.window.createTerminal(`Laravel: ${moduleName}`);
    terminal.show();
    terminal.sendText(`cd ${root}`);
    const sendArtisan = (cmd: string) => terminal.sendText(`php artisan ${cmd}`);

    const failedSteps: string[] = [];

    const steps = [
        {
            name: 'Request',
            fn: () => writeRequestStub(root, moduleName, generateValidationRulesFromJson(fieldObjects))
        },
        {
            name: 'Traits',
            fn: () => {
                writeStubFile(path.join(root, `app/Traits/JsonResponse.php`), jsonResponseStub());
                writeStubFile(path.join(root, `app/Traits/Media.php`), mediaTraitStub());
                writeStubFile(path.join(root, `app/Http/Resources/PaginatedCollection.php`), paginatedCollectionStub());
            }
        },
        {
            name: 'Service',
            fn: () => writeStubFile(
                path.join(root, `app/Services/${moduleName}Service.php`),
                serviceStub(moduleName, fields)
            )
        },
        {
            name: 'Controller',
            fn: () => writeStubFile(
                path.join(root, `app/Http/Controllers/${moduleName}Controller.php`),
                controllerStub(moduleName)
            )
        },
        {
            name: 'Migration',
            fn: () => createMigrationFile(root, snakeCase, fields)
        },
        {
            name: 'Model',
            fn: () => writeModelStub(root, moduleName, fields)
        },
        {
            name: 'Resource',
            fn: () => sendArtisan(`make:resource ${moduleName}Resource`)
        },
        {
            name: 'Routes',
            fn: () => addApiRoute(root, kebabCase, moduleName)
        }
    ];

    for (const step of steps) {
        try {
            step.fn();
        } catch (err: any) {
            failedSteps.push(`${step.name}: ${err.message}`);
        }
    }

    if (failedSteps.length > 0) {
        vscode.window.showErrorMessage(`Some steps failed:\n${failedSteps.join('\n')}`);
    } else {
        terminal.sendText(`composer dump-autoload`);
        terminal.sendText(`php artisan optimize:clear`);
        autoGit(moduleName)
        setTimeout(() => {
            vscode.window.showInformationMessage(`CRUD for "${moduleName}" generated successfully.`);
        }, 2000);
    }
}

function runCommand(cmd: string, cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(cmd, { cwd }, (error, stdout, stderr) => {
            if (error) {
                reject(stderr || error.message);
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

async function gitExists(): Promise<boolean> {
    try {
        await runCommand("git --version", process.cwd());
        return true;
    } catch {
        return false;
    }
}

function isRepo(workspacePath: string): boolean {
    return fs.existsSync(path.join(workspacePath, ".git"));
}

async function initRepo(workspacePath: string) {
    await runCommand("git init", workspacePath);
    await runCommand("git add .", workspacePath);
    await runCommand(`git commit -m "chore: initial commit"`, workspacePath);
}

export async function autoGit(moduleName: string) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage("No workspace folder found.");
        return;
    }

    const workspacePath = workspaceFolders[0].uri.fsPath;

    if (!(await gitExists())) {
        vscode.window.showErrorMessage("Git not installed. Please install Git.");
        return;
    }

    if (!isRepo(workspacePath)) {
        vscode.window.showInformationMessage("No Git repo found. Initializing one...");
        try {
            await initRepo(workspacePath);
        } catch (err: any) {
            vscode.window.showErrorMessage(`Failed to initialize repo: ${err}`);
            return;
        }
    }

    const branch = `feature/${moduleName.toLowerCase()}`;

    try {
        // Try to checkout new branch, fallback to existing
        await runCommand(`git checkout -b ${branch}`, workspacePath).catch(async () => {
            await runCommand(`git checkout ${branch}`, workspacePath);
        });

        await runCommand("git add .", workspacePath);

        // Commit (skip if nothing to commit)
        await runCommand(`git commit -m "feat: Added ${moduleName} CRUD"`, workspacePath).catch(() => {
            // ignore "nothing to commit"
        });

        // Push (safe with -u origin)
        await runCommand(`git push -u origin ${branch}`, workspacePath).catch(() => {
            vscode.window.showWarningMessage(`Branch "${branch}" created locally but push failed (no remote?).`);
        });

        vscode.window.showInformationMessage(`Git: CRUD for "${moduleName}" committed to branch "${branch}".`);
    } catch (err: any) {
        vscode.window.showErrorMessage(`Git error: ${err}`);
    }
}

export async function generateCrud(workspaceRoot: string) {
    const rawInput = await vscode.window.showInputBox({ prompt: 'Enter Module Name (e.g., Product)' });
    if (!rawInput) return;

    const kebabCase = rawInput.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    const moduleName = toStudly(rawInput);
    const snakeCase = toSnake(moduleName);

    const options = await vscode.window.showQuickPick(
        [
            'Full CRUD (Model, Service, Controller, Request, Resource)',
            'Only Model',
            'Only Controller',
            'Only Request',
            'Only Resource',
        ],
        { placeHolder: 'Select component to generate' }
    );
    if (!options) return;

    if (options == 'Full CRUD (Model, Service, Controller, Request, Resource)') {
        const fields = await vscode.window.showInputBox({
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
        const sendArtisan = (cmd: string) => terminal.sendText(`php artisan ${cmd}`);

        const failedSteps: string[] = [];

        const steps = [
            {
                name: 'Request',
                fn: () => writeRequestStub(workspaceRoot, moduleName, generateValidationRules(fields))
            },
            {
                name: 'Traits',
                fn: () => {
                    writeStubFile(path.join(workspaceRoot, `app/Traits/JsonResponse.php`), jsonResponseStub());
                    writeStubFile(path.join(workspaceRoot, `app/Traits/Media.php`), mediaTraitStub());
                    writeStubFile(path.join(workspaceRoot, `app/Http/Resources/PaginatedCollection.php`), paginatedCollectionStub());
                }
            },
            {
                name: 'Service',
                fn: () => writeStubFile(
                    path.join(workspaceRoot, `app/Services/${moduleName}Service.php`),
                    serviceStub(moduleName, fields)
                )
            },
            {
                name: 'Controller',
                fn: () => writeStubFile(
                    path.join(workspaceRoot, `app/Http/Controllers/${moduleName}Controller.php`),
                    controllerStub(moduleName)
                )
            },
            {
                name: 'Migration',
                fn: () => createMigrationFile(workspaceRoot, snakeCase, fields)
            },
            {
                name: 'Model',
                fn: () => writeModelStub(workspaceRoot, moduleName, fields)
            },
            {
                name: 'Resource',
                fn: () => sendArtisan(`make:resource ${moduleName}Resource`)
            },
            {
                name: 'Routes',
                fn: () => addApiRoute(workspaceRoot, kebabCase, moduleName)
            }
        ];

        for (const step of steps) {
            try {
                step.fn();
            } catch (err: any) {
                failedSteps.push(`${step.name}: ${err.message}`);
            }
        }

        if (failedSteps.length > 0) {
            vscode.window.showErrorMessage(`Some steps failed:\n${failedSteps.join('\n')}`);
        } else {

            terminal.sendText(`composer dump-autoload`);
            terminal.sendText(`php artisan optimize:clear`);

        }
    } else {
        const terminal = vscode.window.createTerminal(`Laravel: ${moduleName}`);
        terminal.show();
        terminal.sendText(`cd ${workspaceRoot}`);
        const sendArtisan = (cmd: string) => terminal.sendText(`php artisan ${cmd}`);

        // Individual selections
        if (options.includes('Model')) sendArtisan(`make:model ${moduleName}`);
        if (options.includes('Request')) sendArtisan(`make:request ${moduleName}Request`);
        if (options.includes('Resource')) sendArtisan(`make:resource ${moduleName}Resource`);
        if (options.includes('Controller')) {
            writeStubFile(path.join(workspaceRoot, `app/Http/Controllers/${moduleName}Controller.php`), controllerStub(moduleName));
        }

    }
}
