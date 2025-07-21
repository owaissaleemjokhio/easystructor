export const mediaTraitStub = () => `<?php

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
