"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaTraitStub = void 0;
const mediaTraitStub = () => `<?php

namespace App\\Traits;

use Illuminate\\Support\\Str;

trait Media
{
    /**
     * Upload media and generate media path.
     *
     * @param  mixed \$request
     * @param  string \$folder
     * @return string
     */
    public static function media(\$request, \$folder = "")
    {
        \$file = \$request->file('media');
        \$extension = \$file->guessExtension() ?? \$file->getClientOriginalExtension();

        \$path = \$request->file('media')->storeAs(
            \$folder,
            Str::random(10) . '.' . \$extension,
            env('DISK', 'public')
        );

        return \$path;
        // return \\Storage::disk(env('DISK', 'public'))->url(\$path);
    }
}
`;
exports.mediaTraitStub = mediaTraitStub;
//# sourceMappingURL=mediaTraitStub.js.map