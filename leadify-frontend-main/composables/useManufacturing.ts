/**
 * Manufacturing System
 * BOM, work orders, production planning, and quality control.
 * Backed by /api/manufacturing endpoints.
 */
import { ref, computed } from 'vue';
import { useApiFetch } from './useApiFetch';

export interface BOMItem {
    id?: number;
    name: string;
    type: 'RAW' | 'SUB_ASSEMBLY';
    quantity: number;
    unit: string;
    unitCost: number;
}

export interface BOM {
    id: number;
    productName: string;
    code: string;
    version: number;
    isActive: boolean;
    totalCost: number;
    items: BOMItem[];
}

export interface WorkOrder {
    id: number;
    woNumber: string;
    productName: string;
    bomId?: number;
    bomCode?: string;
    planned: number;
    produced: number;
    priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
    status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
    dueDate?: string;
}

export interface QualityCheck {
    id: number;
    woNumber?: string;
    product?: string;
    inspector?: string;
    inspected: number;
    passed: number;
    defects: number;
    result: 'PASS' | 'FAIL' | 'PENDING';
}

export interface ManufacturingStats {
    bomCount: number;
    woCount: number;
    completed: number;
    inProgress: number;
    qualityIssues: number;
    efficiency: number;
}

const boms = ref<BOM[]>([]);
const workOrders = ref<WorkOrder[]>([]);
const qualityChecks = ref<QualityCheck[]>([]);
const mfgStats = ref<ManufacturingStats>({ bomCount: 0, woCount: 0, completed: 0, inProgress: 0, qualityIssues: 0, efficiency: 0 });
const loading = ref(false);

export function useManufacturing() {
    const productionEfficiency = computed(() => mfgStats.value.efficiency);
    const qualityIssues = computed(() => mfgStats.value.qualityIssues);

    // ── Data Loading ──
    async function loadBOMs() {
        const { body, success } = await useApiFetch('manufacturing/bom');
        if (success && Array.isArray(body)) boms.value = body;
    }

    async function loadWorkOrders() {
        const { body, success } = await useApiFetch('manufacturing/work-orders');
        if (success && Array.isArray(body)) workOrders.value = body;
    }

    async function loadQualityChecks() {
        const { body, success } = await useApiFetch('manufacturing/quality');
        if (success && Array.isArray(body)) qualityChecks.value = body;
    }

    async function loadStats() {
        const { body, success } = await useApiFetch('manufacturing/stats');
        if (success && body) mfgStats.value = body as ManufacturingStats;
    }

    async function init() {
        loading.value = true;
        await Promise.all([loadBOMs(), loadWorkOrders(), loadQualityChecks(), loadStats()]);
        loading.value = false;
    }

    // ── BOM ──
    async function createBOM(data: { productName: string; code: string; version: number; items: Omit<BOMItem, 'id'>[] }) {
        const { body, success } = await useApiFetch('manufacturing/bom', 'POST', data as any);
        if (success && body) {
            boms.value.unshift(body as BOM);
            await loadStats();
        }
        return body;
    }

    async function updateBOM(id: number, data: any) {
        const { body, success } = await useApiFetch(`manufacturing/bom/${id}`, 'PATCH', data);
        if (success && body) {
            const idx = boms.value.findIndex(b => b.id === id);
            if (idx >= 0) boms.value[idx] = body as BOM;
        }
        return body;
    }

    async function deleteBOM(id: number) {
        const { success } = await useApiFetch(`manufacturing/bom/${id}`, 'DELETE');
        if (success) {
            boms.value = boms.value.filter(b => b.id !== id);
            await loadStats();
        }
    }

    async function duplicateBOM(id: number) {
        const { body, success } = await useApiFetch(`manufacturing/bom/${id}/duplicate`, 'POST');
        if (success && body) {
            boms.value.unshift(body as BOM);
            await loadStats();
        }
        return body;
    }

    // ── Work Orders ──
    async function createWorkOrder(data: { bomId?: number; quantity: number; priority: string; dueDate?: string; productName?: string }) {
        const { body, success } = await useApiFetch('manufacturing/work-orders', 'POST', data as any);
        if (success && body) {
            workOrders.value.unshift(body as WorkOrder);
            await loadStats();
        }
        return body;
    }

    async function updateWorkOrder(id: number, data: any) {
        const { body, success } = await useApiFetch(`manufacturing/work-orders/${id}`, 'PATCH', data);
        if (success && body) {
            const idx = workOrders.value.findIndex(w => w.id === id);
            if (idx >= 0) workOrders.value[idx] = body as WorkOrder;
            await loadStats();
        }
        return body;
    }

    async function updateProduction(id: number, produced: number) {
        const { body, success } = await useApiFetch(`manufacturing/work-orders/${id}/production`, 'PATCH', { produced } as any);
        if (success && body) {
            const idx = workOrders.value.findIndex(w => w.id === id);
            if (idx >= 0) workOrders.value[idx] = body as WorkOrder;
            await loadStats();
        }
        return body;
    }

    // ── Quality Checks ──
    async function createQualityCheck(data: Omit<QualityCheck, 'id' | 'defects' | 'result'>) {
        const { body, success } = await useApiFetch('manufacturing/quality', 'POST', data as any);
        if (success && body) {
            qualityChecks.value.unshift(body as QualityCheck);
            await loadStats();
        }
        return body;
    }

    return {
        boms, workOrders, qualityChecks, mfgStats, loading,
        productionEfficiency, qualityIssues,
        init, loadBOMs, loadWorkOrders, loadQualityChecks, loadStats,
        createBOM, updateBOM, deleteBOM, duplicateBOM,
        createWorkOrder, updateWorkOrder, updateProduction,
        createQualityCheck,
    };
}
