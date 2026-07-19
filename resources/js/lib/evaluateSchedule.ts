import { type OperatingHour } from '../Types/outlet';

export interface ScheduleEvaluation {
    isOpen: boolean;
    msg: string;
}

/**
 * Pure evaluation of today's operating hours.
 * Returns null when schedule is not an array or today has no entry.
 * Parent is responsible for applying the result to its own state.
 */
export function evaluateSchedule(schedule: OperatingHour[]): ScheduleEvaluation | null {
    if (!Array.isArray(schedule)) return null;
    const daysMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const now = new Date();
    const todayName = daysMap[now.getDay()];
    const todaySchedule = schedule.find((d) => d.day === todayName);
    if (!todaySchedule) return null;

    if (!todaySchedule.isOpen) {
        return { isOpen: false, msg: `Restoran hari ini (${todayName}) TUTUP.` };
    }

    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
    if (currentTime < todaySchedule.openTime || currentTime > todaySchedule.closeTime) {
        return {
            isOpen: false,
            msg: `Restoran sedang TUTUP. Jam operasional hari ini: ${todaySchedule.openTime} - ${todaySchedule.closeTime} WIB.`,
        };
    }

    return {
        isOpen: true,
        msg: `Buka hari ini: ${todaySchedule.openTime} - ${todaySchedule.closeTime} WIB`,
    };
}
