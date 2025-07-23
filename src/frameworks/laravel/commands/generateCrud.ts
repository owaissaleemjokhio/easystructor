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

            setTimeout(() => {
                vscode.window.showInformationMessage(`Full CRUD for "${moduleName}" generated successfully.`,
                    { modal: true }
                );
            }, 3000);
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
