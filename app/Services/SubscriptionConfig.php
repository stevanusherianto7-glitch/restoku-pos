<?php

namespace App\Services;

/**
 * SubscriptionConfig — helper baca config/subscription.php dengan struktur bertingkat.
 *
 * Tiap tier mewarisi fitur tier di bawahnya (`inherits`). `allFeatures()`
 * menggabungkan (flatten) seluruh fitur yang didapat sebuah plan, urut dari
 * tier terbawah → tier ini. Dipakai landing page & checkout agar tampilan
 * konsisten dengan model hak akses di FeatureRegistry (basic ⊂ pro ⊂ enterprise).
 */
class SubscriptionConfig
{
    /**
     * Seluruh fitur yang didapat sebuah plan (inherit + extra), tanpa duplikat.
     *
     * @return array<int, string>
     */
    public static function allFeatures(string $plan): array
    {
        $plans = config('subscription.plans', []);
        if (! isset($plans[$plan])) {
            return [];
        }

        $chain = [];
        $current = $plan;
        while ($current !== null && isset($plans[$current])) {
            array_unshift($chain, $current); // basic duluan, lalu pro, lalu enterprise
            $current = $plans[$current]['inherits'] ?? null;
        }

        $features = [];
        foreach ($chain as $tier) {
            foreach ($plans[$tier]['features'] ?? [] as $f) {
                if (! in_array($f, $features, true)) {
                    $features[] = $f;
                }
            }
        }

        return $features;
    }

    /**
     * Fitur tambahan (extra) di tier ini di atas tier yang diwarisi.
     *
     * @return array<int, string>
     */
    public static function extraFeatures(string $plan): array
    {
        $plans = config('subscription.plans', []);

        return $plans[$plan]['features'] ?? [];
    }

    /**
     * Nama tier yang diwarisi (null untuk basic).
     */
    public static function inherits(string $plan): ?string
    {
        return config("subscription.plans.$plan.inherits");
    }
}
