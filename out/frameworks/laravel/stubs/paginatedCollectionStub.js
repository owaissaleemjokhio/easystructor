"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginatedCollectionStub = void 0;
const paginatedCollectionStub = () => `<?php

namespace App\\Http\\Resources;

use Illuminate\\Http\\Request;
use Illuminate\\Http\\Resources\\Json\\ResourceCollection;

class PaginatedCollection extends ResourceCollection
{
    public function __construct(\$resource, \$resourceName, \$modelResource = null)
    {
        parent::__construct(\$resource);
        \$this->modelResource = \$modelResource;
        \$this->resourceName = \$resourceName;
        \$this->resource = \$resource;
    }

    public function toArray(\$request)
    {
        \$output = parent::toArray(\$request);

        return [
            'current_page' => \$this->currentPage(),
            \$this->resourceName => \$this->modelResource::collection(\$this->collection),
            'first_page_url' => \$this->url(1),
            'from' => \$this->firstItem(),
            'last_page' => max((int) ceil(\$this->total() / \$this->perPage()), 1),
            'last_page_url' => \$this->url(\$this->lastPage()),
            'links' => \$this->linkCollection()->toArray(),
            'next_page_url' => \$this->nextPageUrl(),
            'path' => \$this->path(),
            'per_page' => \$this->perPage(),
            'prev_page_url' => \$this->previousPageUrl(),
            'to' => \$this->lastItem(),
            'total' => \$this->total(),
        ];
    }
}
`;
exports.paginatedCollectionStub = paginatedCollectionStub;
//# sourceMappingURL=paginatedCollectionStub.js.map