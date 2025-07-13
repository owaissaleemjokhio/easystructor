export function controllerStub(name: string): string {
    return `<?php

namespace App\\Http\\Controllers;

use App\\Services\\${name}Service;
use App\\Http\\Requests\\${name}Request;

class ${name}Controller extends Controller
{
    public function __construct(protected ${name}Service $service) {}

    public function index() {
        return response()->json($this->service->all());
    }

    public function store(${name}Request $request) {
        return response()->json($this->service->create($request->validated()));
    }

    public function show($id) {
        return response()->json($this->service->get($id));
    }

    public function update(${name}Request $request, $id) {
        return response()->json($this->service->update($request->validated(), $id));
    }

    public function destroy($id) {
        return response()->json($this->service->delete($id));
    }
}
`;
}

export function serviceStub(name: string): string {
    return `<?php

namespace App\\Services;

use App\\Models\\${name};

class ${name}Service
{
    public function all() {
        return ${name}::all();
    }

    public function create(array $data) {
        return ${name}::create($data);
    }

    public function get($id) {
        return ${name}::findOrFail($id);
    }

    public function update(array $data, $id) {
        $record = ${name}::findOrFail($id);
        $record->update($data);
        return $record;
    }

    public function delete($id) {
        return ${name}::destroy($id);
    }
}
`;
}
