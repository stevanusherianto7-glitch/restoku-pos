<?php
// scripts/clean-shard.php — drop schema tenant_% sisa dari run sebelumnya (idempoten)
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

if (config('database.default') !== 'pgsql') {
    echo "bukan pgsql, skip cleanup\n";

    return;
}

$schemas = DB::select("SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'");
foreach ($schemas as $s) {
    DB::statement('DROP SCHEMA IF EXISTS "'.$s->schema_name.'" CASCADE');
    echo 'dropped '.$s->schema_name."\n";
}
echo 'cleanup done'."\n";
