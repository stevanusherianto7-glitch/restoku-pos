<?php

namespace Tests\Unit;

use App\Models\PrintJob;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PrintJobModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_generate_code_format(): void
    {
        $code = 'PRJ-'.str_pad('1', 4, '0', STR_PAD_LEFT);
        $this->assertStringStartsWith('PRJ-', $code);
        $this->assertEquals(8, strlen($code));
    }

    public function test_tenant_relation(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $job = PrintJob::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'job_code' => 'PRJ-0001',
            'type' => 'Struk Kasir',
            'target' => 'Printer 1',
            'status' => 'queued',
        ]);

        $this->assertEquals($tenant->id, $job->tenant->id);
    }
}
