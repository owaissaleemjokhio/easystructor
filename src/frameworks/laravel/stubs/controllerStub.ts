import { toCamel, toSnake } from '../utils/stringUtils';

export function controllerStub(name: string): string {
    return `<?php

namespace App\\Http\\Controllers;

use App\\Http\\Requests\\${name}Request;
use App\\Http\\Resources\\PaginatedCollection;
use App\\Http\\Resources\\${name}Resource;
use App\\Services\\${name}Service;
use App\\Traits\\JsonResponse;

class ${name}Controller extends Controller
{
    use JsonResponse;

    public function __construct(private ${name}Service $${toCamel(name)}Service) {}

    /**
     * Get All ${name} list
     *
     * @return \\Illuminate\\Http\\JsonResponse|string
     * 
     */
    public function index(): \\Illuminate\\Http\\JsonResponse|string
    {
        $records = $this->${toCamel(name)}Service->all();

       if (is_string(\$records)) {
            return \$this->response([], 404, [\$records] );
        }

        return \$this->response(
            new PaginatedCollection($records, '${toSnake(name)}', ${name}Resource::class),
            200,
            [__('${name} list fetched successfully.')]
        );
    }

    /**
     * Save ${name} Data
     *
     * @param ${name}Request $request
     * @return \\Illuminate\\Http\\JsonResponse|array
     */
    public function store(${name}Request \$request): \\Illuminate\\Http\\JsonResponse
    {
        \$record = \$this->${toCamel(name)}Service->store(\$request);
        
        if (is_string(\$record)) {
            return \$this->response([], 404, [\$record] );
        }

        return \$this->response(
            ["${toSnake(name)}" => new ${name}Resource(\$record)],
            201,
            [__('${name} created successfully.')]
        );
    }

    /**
     * Display the specified ${name}.
     *
     * @param integer \$id
     * @return \\Illuminate\\Http\\JsonResponse
     */
    public function show(int \$id): \\Illuminate\\Http\\JsonResponse
    {
        \$record = \$this->${toCamel(name)}Service->find(\$id);

        if (is_string(\$record)) {
            return \$this->response([], 404, [\$record]);
        }

        return \$this->response(
            ["${toSnake(name)}" => new ${name}Resource(\$record)],
            200,
            [__('${name} fetched successfully.')]
        );
    }

    /**
     * Update the specified ${name}.
     *
     * @param ${name}Request $request
     * @param integer \$id
     * @return \\Illuminate\\Http\\JsonResponse
     */
    public function update(${name}Request \$request, int \$id): \\Illuminate\\Http\\JsonResponse
    {
        \$record = \$this->${toCamel(name)}Service->update(\$id, \$request);

        if (is_string(\$record)) {
            return \$this->response([], 404, [\$record]);
        }

        return \$this->response(
            ["${toSnake(name)}" => new ${name}Resource(\$record)],
            200,
            [__('${name} updated successfully.')]
        );
    }

    /**
     * Delete the specified ${name}.
     *
     * @param integer \$id
     * @return \\Illuminate\\Http\\JsonResponse
     */
    public function destroy(int \$id): \\Illuminate\\Http\\JsonResponse
    {
        \$deleted = \$this->${toCamel(name)}Service->delete(\$id);

        if (is_string(\$deleted)) {
            return \$this->response([], 404, [\$deleted]);
        }

        return \$this->response([], 200, [__('${name} deleted successfully.')]);
    }

}`;
}
