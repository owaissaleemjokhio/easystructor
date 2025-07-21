import * as vscode from 'vscode';
import * as path from 'path';
import { writeStubFile, addApiRoute } from '../utils/fileHelpers';
import { controllerStub } from '../stubs/controllerStub';
import { serviceStub } from '../stubs/serviceStub';
import { jsonResponseStub } from '../stubs/jsonResponseStub';
import { mediaTraitStub } from '../stubs/mediaTraitStub';
import { paginatedCollectionStub } from '../stubs/paginatedCollectionStub';
import { toStudly } from '../utils/stringUtils';

export async function generateCrud(workspaceRoot: string) {
    const rawInput = await vscode.window.showInputBox({ prompt: 'Enter Module Name (e.g., Product)' });
    if (!rawInput) return;

    const kebabCase = rawInput.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    const moduleName = toStudly(rawInput);

    const options = await vscode.window.showQuickPick(
        [
            'Full CRUD (Model, Service, Controller, Request, Resource)',
            'Only Model',
            'Only Controller',
            'Only Service',
            'Only Request',
            'Only Resource',
        ],
        { placeHolder: 'Select component to generate' }
    );
    if (!options) return;

    const terminal = vscode.window.createTerminal(`Laravel: ${moduleName}`);
    terminal.show();
    terminal.sendText(`cd ${workspaceRoot}`);

    const sendArtisan = (cmd: string) => terminal.sendText(`php artisan ${cmd}`);

    switch (options) {
        case 'Full CRUD (Model, Service, Controller, Request, Resource)':
            sendArtisan(`make:model ${moduleName}`);
            sendArtisan(`make:request ${moduleName}Request`);
            sendArtisan(`make:resource ${moduleName}Resource`);

            writeStubFile(path.join(workspaceRoot, `app/Traits/JsonResponse.php`), jsonResponseStub());
            writeStubFile(path.join(workspaceRoot, `app/Traits/Media.php`), mediaTraitStub());
            writeStubFile(path.join(workspaceRoot, `app/Http/Resources/PaginatedCollection.php`), paginatedCollectionStub());

            writeStubFile(path.join(workspaceRoot, `app/Services/${moduleName}Service.php`), serviceStub(moduleName));
            writeStubFile(path.join(workspaceRoot, `app/Http/Controllers/${moduleName}Controller.php`), controllerStub(moduleName));
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
            writeStubFile(path.join(workspaceRoot, `app/Services/${moduleName}Service.php`), serviceStub(moduleName));
            break;
        case 'Only Controller':
            writeStubFile(path.join(workspaceRoot, `app/Http/Controllers/${moduleName}Controller.php`), controllerStub(moduleName));
            break;
    }

    if (['Full CRUD (Model, Service, Controller, Request, Resource)', 'Only Controller'].includes(options)) {
        addApiRoute(workspaceRoot, kebabCase, moduleName);
    }
}
