<?php

namespace Tests\Unit;

use App\Services\FeatureRegistry;
use PHPUnit\Framework\TestCase;

class FeatureRegistryTest extends TestCase
{
    public function test_plan_has_feature_basic_returns_free_features(): void
    {
        $this->assertTrue(FeatureRegistry::planHasFeature('basic', 'pbjt_tax'));
        $this->assertTrue(FeatureRegistry::planHasFeature('basic', 'qris'));
        $this->assertTrue(FeatureRegistry::planHasFeature('basic', 'thermal_print'));
    }

    public function test_plan_has_feature_basic_does_not_have_pro_features(): void
    {
        $this->assertFalse(FeatureRegistry::planHasFeature('basic', 'multi_outlet'));
        $this->assertFalse(FeatureRegistry::planHasFeature('basic', 'ppn_tax'));
        $this->assertFalse(FeatureRegistry::planHasFeature('basic', 'kds'));
    }

    public function test_plan_has_feature_pro_has_all_basic_plus_pro_features(): void
    {
        $this->assertTrue(FeatureRegistry::planHasFeature('pro', 'pbjt_tax'));
        $this->assertTrue(FeatureRegistry::planHasFeature('pro', 'multi_outlet'));
        $this->assertTrue(FeatureRegistry::planHasFeature('pro', 'ppn_tax'));
        $this->assertTrue(FeatureRegistry::planHasFeature('pro', 'wa_notif'));
        $this->assertFalse(FeatureRegistry::planHasFeature('pro', 'kds'));
        $this->assertFalse(FeatureRegistry::planHasFeature('pro', 'white_label'));
    }

    public function test_plan_has_feature_enterprise_has_all_features(): void
    {
        $this->assertTrue(FeatureRegistry::planHasFeature('enterprise', 'kds'));
        $this->assertTrue(FeatureRegistry::planHasFeature('enterprise', 'white_label'));
        $this->assertTrue(FeatureRegistry::planHasFeature('enterprise', 'priority_support'));
        $this->assertTrue(FeatureRegistry::planHasFeature('enterprise', 'unlimited_outlet'));
    }

    public function test_plan_has_feature_unknown_plan_returns_false(): void
    {
        $this->assertFalse(FeatureRegistry::planHasFeature('unknown', 'pbjt_tax'));
    }

    public function test_minimum_plan_for_returns_correct_plan(): void
    {
        $this->assertEquals('enterprise', FeatureRegistry::minimumPlanFor('kds'));
        $this->assertEquals('enterprise', FeatureRegistry::minimumPlanFor('white_label'));
        $this->assertEquals('pro', FeatureRegistry::minimumPlanFor('multi_outlet'));
        $this->assertEquals('pro', FeatureRegistry::minimumPlanFor('ppn_tax'));
    }

    public function test_minimum_plan_for_free_feature_returns_null(): void
    {
        $this->assertNull(FeatureRegistry::minimumPlanFor('pbjt_tax'));
        $this->assertNull(FeatureRegistry::minimumPlanFor('qris'));
    }

    public function test_minimum_plan_for_unknown_feature_returns_null(): void
    {
        $this->assertNull(FeatureRegistry::minimumPlanFor('nonexistent_feature'));
    }

    public function test_all_features_for_plan_basic(): void
    {
        $features = FeatureRegistry::allFeaturesForPlan('basic');
        $this->assertContains('pbjt_tax', $features);
        $this->assertContains('qris', $features);
        $this->assertNotContains('multi_outlet', $features);
    }

    public function test_all_features_for_plan_enterprise(): void
    {
        $features = FeatureRegistry::allFeaturesForPlan('enterprise');
        $this->assertContains('kds', $features);
        $this->assertContains('white_label', $features);
        $this->assertContains('multi_outlet', $features);
    }

    public function test_all_features_for_unknown_plan_returns_basic(): void
    {
        $features = FeatureRegistry::allFeaturesForPlan('unknown');
        $expected = FeatureRegistry::allFeaturesForPlan('basic');
        $this->assertEquals($expected, $features);
    }

    public function test_plan_meets_requirement(): void
    {
        $this->assertTrue(FeatureRegistry::planMeetsRequirement('enterprise', 'pro'));
        $this->assertTrue(FeatureRegistry::planMeetsRequirement('pro', 'pro'));
        $this->assertTrue(FeatureRegistry::planMeetsRequirement('enterprise', 'basic'));
        $this->assertFalse(FeatureRegistry::planMeetsRequirement('basic', 'pro'));
        $this->assertFalse(FeatureRegistry::planMeetsRequirement('basic', 'enterprise'));
    }

    public function test_plan_meets_requirement_unknown_plan(): void
    {
        $this->assertFalse(FeatureRegistry::planMeetsRequirement('unknown', 'basic'));
        $this->assertFalse(FeatureRegistry::planMeetsRequirement('enterprise', 'unknown'));
    }

    public function test_to_inertia_payload_contains_feature_locks(): void
    {
        $payload = FeatureRegistry::toInertiaPayload();
        $this->assertArrayHasKey('feature_locks', $payload);
        $this->assertArrayHasKey('plan_hierarchy', $payload);
        $this->assertArrayHasKey('kds', $payload['feature_locks']);
        $this->assertEquals(3, $payload['plan_hierarchy']['enterprise']);
    }
}
