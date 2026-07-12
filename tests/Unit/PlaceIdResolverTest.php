<?php

namespace Tests\Unit;

use App\Services\PlaceIdResolver;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PlaceIdResolverTest extends TestCase
{
    public function test_resolve_place_id_direct(): void
    {
        $this->assertEquals('ChIJabc123', (new PlaceIdResolver)->resolve('ChIJabc123'));
    }

    public function test_resolve_url_with_chij(): void
    {
        $url = 'https://maps.google.com/?q&ftid=ChIJabc123';
        $this->assertEquals('ChIJabc123', (new PlaceIdResolver)->resolve($url));
    }

    public function test_resolve_coordinate_at_format(): void
    {
        config(['google-business-profile.places_api_key' => 'test-key']);
        Http::fake([
            'maps.googleapis.com/maps/api/geocode/*' => Http::response([
                'status' => 'OK',
                'results' => [['place_id' => 'ChIJresolved123']],
            ]),
        ]);

        $url = 'https://www.google.com/maps/@-6.2,106.8,15z';
        $this->assertEquals('ChIJresolved123', (new PlaceIdResolver)->resolve($url));
    }

    public function test_resolve_coordinate_bang_format(): void
    {
        config(['google-business-profile.places_api_key' => 'test-key']);
        Http::fake([
            'maps.googleapis.com/maps/api/geocode/*' => Http::response([
                'status' => 'OK',
                'results' => [['place_id' => 'ChIJresolved123']],
            ]),
        ]);

        $url = 'https://maps.google.com/maps/place/X/@-6.2,106.8,17z?entry=ttu';
        $this->assertEquals('ChIJresolved123', (new PlaceIdResolver)->resolve($url));
    }

    public function test_resolve_no_coordinate_returns_null(): void
    {
        $this->assertNull((new PlaceIdResolver)->resolve('resto enak jakarta'));
    }

    public function test_resolve_empty_returns_null(): void
    {
        $this->assertNull((new PlaceIdResolver)->resolve(''));
    }
}
