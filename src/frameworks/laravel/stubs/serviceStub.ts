export function serviceStub(name: string): string {
    return `<?php

namespace App\\Services;

use App\\Http\\Requests\\${name}Request;
use Illuminate\\Contracts\\Database\\Eloquent\\Builder;
use App\\Models\\${name};
use Illuminate\\Http\\Request;

final class ${name}Service
{
    /**
     * ${name}Service attributes
     *
     * @var array<int, string>
     */
    private array \$attributes = [
        // Define your model's fillable fields here
        // 'field1', 'field2'
    ];

    /**
     * ${name}Service Constructor
     */
    public function __construct(
        public ${name} \$model,
        public Request \$request
    ) {}

    /**
     * Get all ${name}
     *
     * @return array|null
     */
    public function all()
    {
        \$query = \$this->model;
        \$filters = \$this->request->all();

        if (count(\$filters) > 0) {
            \$query = \$this->applyFilters(\$query, \$filters);
        }

        \$records = \$query->latest()->paginate(\$filters['per_page'] ?? 10);

        if (!\$records) {
            return __('Records not found.');
        }

        return \$records;
    }

    /**
     * Apply Filters
     *
     * @param [type] \$query
     * @param [type] \$filters
     * @return Builder
     */
    protected function applyFilters(\$query, array \$filters): Builder
    {
        // Example: update to match your model fields
        return \$query
            ->when(isset(\$filters['name']), fn(\$q) => \$q->where('name', 'like', '%' . \$filters['name'] . '%'));
    }

    /**
     * Find a single ${name}
     *
     * @param integer \$id
     * @return ${name}|string
     */
    public function find(int \$id): ${name}|string
    {
        \$record = \$this->model->find(\$id);
        if (!\$record) {
            return __('record not found.');
        }
        return \$record;
    }
    
    /**
     * Store a new ${name}
     *
     * @param ${name}Request \$request
     * @return ${name}|array
     */
    public function store(${name}Request \$request): ${name}|array
    {
        \$data = \$request->only(\$this->attributes);
        return \$this->model->create(\$data);
    }

    /**
     * Update an existing ${name}
     *
     * @param integer \$id
     * @param ${name}Request \$request
     * @return  ${name}|string
     */
    public function update(int \$id, ${name}Request \$request): ${name}|string
    {
        \$record = \$this->model->find(\$id);

         if (!\$record) {
            return __('Record not found.');
        }

        return \$record;
    }

    /**
     * Delete a ${name}
     *
     * @param integer \$id
     * @return ${name}|string
     */
    public function delete(int \$id):  ${name}|string
    {
        \$record = \$this->model->find(\$id);
          if (!\$record) {
            return __('Record not found.');
        }

        return \$record->delete();
    }
}
`;
}