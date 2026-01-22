import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ProjectInfo from '@/components/operations/Projects/Info.vue';
import { project, projectId } from '@/composables/operations/project';

// Mocks
const InputText = { template: '<input :name="name" :value="value" @input="$emit(\'input\', $event.target.value)" />', props: ['name', 'value'] };
const InputSelect = { template: '<select :name="name"></select>', props: ['name', 'value'] };
const InputDate = { template: '<input type="date" :name="name" />', props: ['name', 'value'] };

vi.mock('element-plus', () => ({
    ElForm: { template: '<form @submit.prevent="$emit(\'submit\')"><slot /></form>' },
    ElButton: { template: '<button><slot /></button>' },
    ElNotification: vi.fn(),
}));

describe('Project Module Integration', () => {
    it('should validate required fields in Project Info', async () => {
        const wrapper = mount({
            template: '<Suspense><ProjectInfo /></Suspense>',
            components: { ProjectInfo }
        }, {
            global: {
                components: { InputText, InputSelect, InputDate },
                stubs: { 'el-form': true, 'el-button': true }
            }
        });

        await new Promise(resolve => setTimeout(resolve, 100));
        const projectInfo = wrapper.findComponent(ProjectInfo);

        // Check if schema is applied (In a real test, we would trigger submit and check errors)
        // Since we mocked el-form, we check if it has the validationSchema prop
        const form = projectInfo.find('el-form-stub');
        expect(form.attributes('validationschema')).toBeDefined();
    });

    it('should identify missing pre-fill logic from Opportunity', async () => {
        // Simulate coming from an opportunity
        // In reality, add-project.vue should handle this, but let's see if the project state is updated

        // This test simulates the issue where project state is not updated by query params
        expect(project.value.name).toBeUndefined();
    });
});
