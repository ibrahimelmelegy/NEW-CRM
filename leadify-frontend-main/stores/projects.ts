import { defineStore } from 'pinia';
import type { Project } from '~/types/models';
import type { ApiListParams } from '~/types/api';
import type { ProjectStatus } from '~/types/enums';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const useProjectStore = defineStore('projects', {
  state: () => ({
    projects: [] as Project[],
    currentProject: null as Project | null,
    loading: false,
    error: null as string | null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    } as Pagination
  }),

  getters: {
    activeProjects(): Project[] {
      return this.projects.filter((p) => p.status === 'ACTIVE');
    },

    projectsByStatus(): Record<ProjectStatus, Project[]> {
      const grouped = {} as Record<ProjectStatus, Project[]>;
      for (const project of this.projects) {
        if (project.status) {
          if (!grouped[project.status]) {
            grouped[project.status] = [];
          }
          grouped[project.status].push(project);
        }
      }
      return grouped;
    }
  },

  actions: {
    async fetchProjects(params?: ApiListParams) {
      this.loading = true;
      this.error = null;

      try {
        const query = params
          ? '?' + new URLSearchParams(
              Object.entries(params)
                .filter(([, v]) => v !== undefined && v !== '')
                .map(([k, v]) => [k, String(v)])
            ).toString()
          : '';

        const response: any = await useApiFetch(
          `project${query}`
        );

        if (response.success && response.body) {
          this.projects = response.body.docs || [];
          if (response.body.pagination) {
            this.pagination = response.body.pagination;
          }
        } else {
          this.error = response.message || 'Failed to fetch projects';
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch projects';
        this.error = message;
        console.error('Error fetching projects:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchProject(id: string) {
      this.loading = true;
      this.error = null;

      try {
        const response: any = await useApiFetch(`project/${id}`);

        if (response.success && response.body) {
          this.currentProject = response.body;
        } else {
          this.error = response.message || 'Failed to fetch project';
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch project';
        this.error = message;
        console.error('Error fetching project:', error);
      } finally {
        this.loading = false;
      }
    },

    async createProject(data: Partial<Project>) {
      this.loading = true;
      this.error = null;

      try {
        const response: any = await useApiFetch(
          'project',
          'POST',
          data as Record<string, unknown>
        );

        if (response.success && response.body) {
          this.projects.unshift(response.body);
          return response.body;
        } else {
          this.error = response.message || 'Failed to create project';
          return null;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to create project';
        this.error = message;
        console.error('Error creating project:', error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    async updateProject(id: string, data: Partial<Project>) {
      this.loading = true;
      this.error = null;

      try {
        const response: any = await useApiFetch(
          `project/${id}`,
          'PUT',
          data as Record<string, unknown>
        );

        if (response.success && response.body) {
          const index = this.projects.findIndex((p) => p.id === id);
          if (index !== -1) {
            this.projects[index] = response.body;
          }
          if (this.currentProject?.id === id) {
            this.currentProject = response.body;
          }
          return response.body;
        } else {
          this.error = response.message || 'Failed to update project';
          return null;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to update project';
        this.error = message;
        console.error('Error updating project:', error);
        return null;
      } finally {
        this.loading = false;
      }
    }
  }
});
