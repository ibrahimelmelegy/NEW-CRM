import { describe, it, expect } from 'vitest';

// --- Mock Logic for Security ---
interface User {
    id: string;
    role: 'SALES_AGENT' | 'ADMIN' | 'MANAGER';
}

const deleteProject = (user: User, projectId: string) => {
    // Security Gate
    const allowedRoles = ['ADMIN', 'MANAGER'];

    if (!allowedRoles.includes(user.role)) {
        throw new Error('403 Forbidden: You do not have permission to delete projects.');
    }

    // Actual deletion logic mock
    return true; // Success
};

describe('Security: Roles Matrix', () => {
    it('should BLOCK a Sales Agent from deleting a project', () => {
        const salesUser: User = { id: 'u1', role: 'SALES_AGENT' };

        // Expect function to throw an error due to insufficient permissions
        expect(() => deleteProject(salesUser, 'p1')).toThrowError('403 Forbidden');
    });

    it('should ALLOW an Admin to delete a project', () => {
        const adminUser: User = { id: 'u2', role: 'ADMIN' };

        const result = deleteProject(adminUser, 'p1');

        expect(result).toBe(true);
    });
});
