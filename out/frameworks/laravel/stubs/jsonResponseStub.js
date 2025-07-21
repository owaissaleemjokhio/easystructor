"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonResponseStub = void 0;
const jsonResponseStub = () => `<?php

namespace App\\Traits;

trait JsonResponse
{
    /**
     * Structured Json response
     *
     * @param \$data
     * @param \$status
     * @param \$messages
     * @return \\Illuminate\\Http\\JsonResponse
     */
    protected function response(\$data, \$status, \$messages = []): \\Illuminate\\Http\\JsonResponse
    {

        \$response = [
            'status' => \$status,
            'messages' => \$messages
        ];

        \$response['data'] = [];

        if (\$status >= 200 && \$data) {
            if (isset(\$data['pagination']) && \$data['pagination']) {
                \$response['data'] = \$data['data'];
                \$response['pagination'] = \$data['pagination'];
            } else {
                \$response['data'] = \$data;
            }
        }

        if (\$status > 400) {
            return response()->json(['error' => \$response], \$status);
        } else {
            return response()->json(['response' => array_merge(
                \$response,
            )], \$status);
        }
    }
}
`;
exports.jsonResponseStub = jsonResponseStub;
//# sourceMappingURL=jsonResponseStub.js.map