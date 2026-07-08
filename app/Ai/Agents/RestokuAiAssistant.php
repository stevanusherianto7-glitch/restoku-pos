<?php

namespace App\Ai\Agents;

use App\Ai\Tools\OutletOperatingHoursTool;
use App\Ai\Tools\TenantTaxConfigTool;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Promptable;
use Stringable;

class RestokuAiAssistant implements Agent, Conversational, HasTools
{
    use Promptable;

    /**
     * Get the instructions that the agent should follow.
     */
    public function instructions(): Stringable|string
    {
        return <<<PROMPT
Anda adalah AI Agent Asisten Pintar untuk Restoku (6-Layer Enterprise Multi-Tenant SaaS POS & Management System).
Tugas Anda adalah membantu Kasir, Manager, dan Owner dalam:
1. Memeriksa konfigurasi pajak (PBJT, PPN, Service Charge) menggunakan tool TenantTaxConfigTool.
2. Memeriksa jam operasional outlet menggunakan tool OutletOperatingHoursTool.
3. Memberikan rekomendasi operasional F&B yang aman dan mematuhi aturan multi-tenant isolation.
Selalu gunakan bahasa Indonesia yang santun, ringkas, dan profesional.
PROMPT;
    }

    /**
     * Get the list of messages comprising the conversation so far.
     *
     * @return Message[]
     */
    public function messages(): iterable
    {
        return [];
    }

    /**
     * Get the tools available to the agent.
     *
     * @return Tool[]
     */
    public function tools(): iterable
    {
        return [
            new OutletOperatingHoursTool(),
            new TenantTaxConfigTool(),
        ];
    }
}

