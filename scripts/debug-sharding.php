<?php
// scripts/debug-sharding.php — debug DROP + migrate tenant_1
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\TenantConnection;
use Illuminate\Support\Facades\DB;

echo "default conn: ".config('database.default')."\n";
echo "tenant_template driver: ".(config('database.connections.tenant_template.driver') ?? 'UNSET')."\n";
echo "tenant_template host: ".(config('database.connections.tenant_template.host') ?? 'UNSET')."\n";
echo "tenant_template database: ".(config('database.connections.tenant_template.database') ?? 'UNSET')."\n";

$tpl = DB::connection('tenant_template');
echo "tenant_template pdo connected: ".($tpl->getPdo() ? 'yes' : 'no')."\n";

// Coba DROP
try {
    $tpl->statement('DROP SCHEMA IF EXISTS tenant_1 CASCADE');
    echo "DROP tenant_1 OK\n";
} catch (\Throwable $e) {
    echo "DROP ERROR: ".$e->getMessage()."\n";
}

// Cek schema ada?
$exists = $tpl->select("SELECT schema_name FROM information_schema.schemata WHERE schema_name='tenant_1'");
echo "tenant_1 exists after drop? ".json_encode($exists)."\n";

// CREATE
$tpl->statement('CREATE SCHEMA tenant_1');
echo "CREATE tenant_1 OK\n";

$name = app(TenantConnection::class)->resolveForTenant(1);
echo "resolveForTenant(1) -> $name\n";
$migrator = app('migrator');
$migrator->setConnection($name);
DB::connection($name)->statement('CREATE TABLE IF NOT EXISTS migrations (id serial primary key, migration varchar(255) not null, batch integer not null)');
try {
    $migrator->run([database_path('migrations/tenant')]);
    echo "MIGRATE OK\n";
} catch (\Throwable $e) {
    echo "MIGRATE ERROR: ".$e->getMessage()."\n";
}

$tables = $tpl->select("SELECT table_name FROM information_schema.tables WHERE table_schema='tenant_1' AND table_name='agent_conversation_messages'");
echo "agent_conversation_messages in tenant_1: ".json_encode($tables)."\n";
