/**
 * useOpportunity - Unit Tests
 * =============================
 * Tests for composables/useOpportunity.ts
 */

import { describe, it, expect, vi } from 'vitest';
import {
  type Opportunities,
  StageEnum,
  priorityEnum,
  stepsEnum,
  reasonEnum,
  stageOptions,
  priorityOptions,
  stepsOptions,
  reasonOptions
} from '@/composables/useOpportunity';

// Mock API
vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: vi.fn()
}));

describe('useOpportunity.ts', () => {
  // ============================================
  // StageEnum
  // ============================================
  describe('StageEnum', () => {
    it('should have correct values', () => {
      expect(StageEnum.Discovery).toBe('DISCOVERY');
      expect(StageEnum.Proposal).toBe('PROPOSAL');
      expect(StageEnum.Negotiation).toBe('NEGOTIATION');
      expect(StageEnum.Lost).toBe('LOST');
      expect(StageEnum.Won).toBe('WON');
    });

    it('should have 5 stages', () => {
      expect(Object.values(StageEnum)).toHaveLength(5);
    });
  });

  // ============================================
  // priorityEnum
  // ============================================
  describe('priorityEnum', () => {
    it('should have correct values', () => {
      expect(priorityEnum.VeryLow).toBe('VERY_LOW');
      expect(priorityEnum.Low).toBe('LOW');
      expect(priorityEnum.Medium).toBe('MEDIUM');
      expect(priorityEnum.High).toBe('HIGH');
      expect(priorityEnum.VeryHigh).toBe('VERY_HIGH');
    });

    it('should have 5 priorities', () => {
      expect(Object.values(priorityEnum)).toHaveLength(5);
    });
  });

  // ============================================
  // stepsEnum
  // ============================================
  describe('stepsEnum', () => {
    it('should have correct values', () => {
      expect(stepsEnum.ScheduleMeeting).toBe('Schedule Meeting');
      expect(stepsEnum.SendProposal).toBe('Send Proposal');
      expect(stepsEnum.FollowUpCall).toBe('Follow-Up Call');
      expect(stepsEnum.NegotiateTerms).toBe('Negotiate Terms');
      expect(stepsEnum.CloseTheDeal).toBe('Close the Deal');
    });
  });

  // ============================================
  // reasonEnum
  // ============================================
  describe('reasonEnum', () => {
    it('should have correct values', () => {
      expect(reasonEnum.NotInterested).toBe('Not Interested');
      expect(reasonEnum.NoBudget).toBe('No Budget');
      expect(reasonEnum.CompetitorChosen).toBe('Competitor Chosen');
      expect(reasonEnum.Other).toBe('Other');
    });

    it('should have 4 reasons', () => {
      expect(Object.values(reasonEnum)).toHaveLength(4);
    });
  });

  // ============================================
  // Options Arrays
  // ============================================
  describe('stageOptions', () => {
    it('should have 5 stage options', () => {
      expect(stageOptions).toHaveLength(5);
    });

    it('should have correct structure', () => {
      stageOptions.forEach(option => {
        expect(option).toHaveProperty('label');
        expect(option).toHaveProperty('value');
      });
    });
  });

  describe('priorityOptions', () => {
    it('should have 5 priority options', () => {
      expect(priorityOptions).toHaveLength(5);
    });

    it('should include High priority', () => {
      const high = priorityOptions.find(p => p.value === priorityEnum.High);
      expect(high).toBeDefined();
    });
  });

  describe('stepsOptions', () => {
    it('should have 5 step options', () => {
      expect(stepsOptions).toHaveLength(5);
    });
  });

  describe('reasonOptions', () => {
    it('should have 4 reason options', () => {
      expect(reasonOptions).toHaveLength(4);
    });
  });

  // ============================================
  // Opportunities Interface
  // ============================================
  describe('Opportunities interface', () => {
    it('should create valid Opportunities object', () => {
      const opportunity: Opportunities = {
        id: 1,
        name: 'Test Opportunity',
        stage: StageEnum.Discovery,
        estimatedValue: 50000,
        expectedCloseDate: '2024-03-01',
        priority: priorityEnum.High,
        interestedIn: 'Product A',
        nextSteps: ['Schedule Meeting', 'Send Proposal'],
        users: 1,
        leadId: 123
      };

      expect(opportunity.id).toBe(1);
      expect(opportunity.name).toBe('Test Opportunity');
      expect(opportunity.stage).toBe(StageEnum.Discovery);
      expect(opportunity.estimatedValue).toBe(50000);
    });

    it('should allow reasonOfLose for lost opportunities', () => {
      const lostOpportunity: Opportunities = {
        name: 'Lost Deal',
        stage: StageEnum.Lost,
        reasonOfLose: reasonEnum.NoBudget
      };

      expect(lostOpportunity.stage).toBe(StageEnum.Lost);
      expect(lostOpportunity.reasonOfLose).toBe(reasonEnum.NoBudget);
    });
  });
});
