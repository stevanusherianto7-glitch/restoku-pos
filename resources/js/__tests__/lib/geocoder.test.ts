import { describe, it, expect } from 'vitest';
import { runLocalGeocoder } from '../../lib/geocoder';

describe('runLocalGeocoder', () => {
    it('matches Jakarta Selatan / Senopati', () => {
        expect(runLocalGeocoder('Jl Senopati No 5')).toEqual({ lat: '-6.223847', lng: '106.808162' });
        expect(runLocalGeocoder('KEBAYORAN LAMA')).toEqual({ lat: '-6.223847', lng: '106.808162' });
    });

    it('matches Jakarta Barat / Puri Indah', () => {
        expect(runLocalGeocoder('Puri Indah Blok A')).toEqual({ lat: '-6.168329', lng: '106.758852' });
    });

    it('matches Jakarta Utara / PIK / Pluit', () => {
        expect(runLocalGeocoder('PIK')).toEqual({ lat: '-6.111248', lng: '106.782631' });
        expect(runLocalGeocoder('pluit')).toEqual({ lat: '-6.111248', lng: '106.782631' });
    });

    it('matches Jakarta Pusat / Menteng / Sudirman', () => {
        expect(runLocalGeocoder('Jl Sudirman')).toEqual({ lat: '-6.186486', lng: '106.829432' });
    });

    it('matches Jakarta Timur / Jatinegara', () => {
        expect(runLocalGeocoder('Jatinegara Kaum')).toEqual({ lat: '-6.225014', lng: '106.886034' });
    });

    it('matches Surabaya', () => {
        expect(runLocalGeocoder('Tunjungan Surabaya')).toEqual({ lat: '-7.257487', lng: '112.752090' });
    });

    it('matches Bandung', () => {
        expect(runLocalGeocoder('Braga Bandung')).toEqual({ lat: '-6.917464', lng: '107.619123' });
    });

    it('matches Bali / Kuta / Seminyak / Denpasar', () => {
        expect(runLocalGeocoder('Seminyak Bali')).toEqual({ lat: '-8.409518', lng: '115.188919' });
        expect(runLocalGeocoder('DENPASAR')).toEqual({ lat: '-8.409518', lng: '115.188919' });
    });

    it('matches Medan', () => {
        expect(runLocalGeocoder('medan')).toEqual({ lat: '3.595196', lng: '98.672223' });
    });

    it('matches Makassar', () => {
        expect(runLocalGeocoder('Makassar')).toEqual({ lat: '-5.147665', lng: '119.432731' });
    });

    it('matches Jogja / Yogyakarta', () => {
        expect(runLocalGeocoder('YOGYAKARTA')).toEqual({ lat: '-7.795580', lng: '110.369490' });
        expect(runLocalGeocoder('jogja')).toEqual({ lat: '-7.795580', lng: '110.369490' });
    });

    it('matches Semarang', () => {
        expect(runLocalGeocoder('Semarang')).toEqual({ lat: '-6.966667', lng: '110.416667' });
    });

    it('falls back to Jakarta center for unknown address', () => {
        expect(runLocalGeocoder('Desa Mati Gao')).toEqual({ lat: '-6.200000', lng: '106.816666' });
        expect(runLocalGeocoder('')).toEqual({ lat: '-6.200000', lng: '106.816666' });
    });
});
