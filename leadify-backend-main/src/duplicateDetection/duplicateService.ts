import { Op } from 'sequelize';
import { clampPagination } from '../utils/pagination';
import DuplicateSet, { DuplicateStatus } from './duplicateModel';
import Lead from '../lead/leadModel';
import Client from '../client/clientModel';
import Opportunity from '../opportunity/opportunityModel';
import User from '../user/userModel';

// Map entity types to their Sequelize models
const entityModelMap: Record<string, any> = {
  lead: Lead,
  client: Client,
  opportunity: Opportunity
};

// Field mapping per entity type for duplicate detection
const entityFieldMap: Record<string, { email: string; phone: string; name: string; companyName: string }> = {
  lead: { email: 'email', phone: 'phone', name: 'name', companyName: 'companyName' },
  client: { email: 'email', phone: 'phoneNumber', name: 'clientName', companyName: 'companyName' },
  opportunity: { email: '', phone: '', name: 'name', companyName: '' }
};

class DuplicateService {
  // ---- Levenshtein Distance ----

  fuzzyMatch(str1: string, str2: string): number {
    const s1 = this.normalizeForComparison(str1);
    const s2 = this.normalizeForComparison(str2);

    if (s1 === s2) return 100;
    if (s1.length === 0 || s2.length === 0) return 0;

    const distance = this.levenshteinDistance(s1, s2);
    const maxLen = Math.max(s1.length, s2.length);
    const similarity = ((maxLen - distance) / maxLen) * 100;

    return Math.round(similarity * 100) / 100;
  }

  normalizeForComparison(str: string): string {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // remove special chars
      .replace(/\s+/g, ' ') // collapse whitespace
      .trim();
  }

  private levenshteinDistance(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;

    // Use two rows instead of full matrix for memory efficiency
    let prevRow = new Array(n + 1);
    let currRow = new Array(n + 1);

    // Initialize first row
    for (let j = 0; j <= n; j++) {
      prevRow[j] = j;
    }

    for (let i = 1; i <= m; i++) {
      currRow[0] = i;

      for (let j = 1; j <= n; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        currRow[j] = Math.min(
          currRow[j - 1]! + 1, // insertion
          prevRow[j]! + 1, // deletion
          prevRow[j - 1]! + cost // substitution
        );
      }

      // Swap rows
      [prevRow, currRow] = [currRow, prevRow];
    }

    return prevRow[n]!;
  }

  // ---- Normalize phone for comparison ----

  private normalizePhone(phone: string): string {
    if (!phone) return '';
    // Strip everything except digits
    return phone.replace(/\D/g, '');
  }

  // ---- Match Score Calculation ----

  calculateMatchScore(
    record1: Record<string, any>,
    record2: Record<string, any>,
    entityType: string
  ): {
    score: number;
    matchedFields: Array<{ field: string; value1: any; value2: any; similarity: number }>;
  } {
    const fields = entityFieldMap[entityType];
    if (!fields) return { score: 0, matchedFields: [] };

    let highestScore = 0;
    const matchedFields: Array<{ field: string; value1: any; value2: any; similarity: number }> = [];

    switch (entityType) {
      case 'lead': {
        // Email exact match = 95
        if (fields.email && record1[fields.email] && record2[fields.email]) {
          const email1 = this.normalizeForComparison(record1[fields.email]);
          const email2 = this.normalizeForComparison(record2[fields.email]);
          if (email1 && email2 && email1 === email2) {
            highestScore = Math.max(highestScore, 95);
            matchedFields.push({ field: 'email', value1: record1[fields.email], value2: record2[fields.email], similarity: 100 });
          }
        }

        // Phone normalized match = 90
        if (fields.phone && record1[fields.phone] && record2[fields.phone]) {
          const phone1 = this.normalizePhone(record1[fields.phone]);
          const phone2 = this.normalizePhone(record2[fields.phone]);
          if (phone1 && phone2 && phone1 === phone2) {
            highestScore = Math.max(highestScore, 90);
            matchedFields.push({ field: 'phone', value1: record1[fields.phone], value2: record2[fields.phone], similarity: 100 });
          }
        }

        // Company name (fuzzy >80%) + name (fuzzy >80%) = 85
        if (
          fields.companyName &&
          record1[fields.companyName] &&
          record2[fields.companyName] &&
          fields.name &&
          record1[fields.name] &&
          record2[fields.name]
        ) {
          const companySimilarity = this.fuzzyMatch(record1[fields.companyName], record2[fields.companyName]);
          const nameSimilarity = this.fuzzyMatch(record1[fields.name], record2[fields.name]);
          if (companySimilarity > 80 && nameSimilarity > 80) {
            highestScore = Math.max(highestScore, 85);
            matchedFields.push(
              { field: 'companyName', value1: record1[fields.companyName], value2: record2[fields.companyName], similarity: companySimilarity },
              { field: 'name', value1: record1[fields.name], value2: record2[fields.name], similarity: nameSimilarity }
            );
          }
        }
        break;
      }

      case 'client': {
        // Email exact match = 95
        if (fields.email && record1[fields.email] && record2[fields.email]) {
          const email1 = this.normalizeForComparison(record1[fields.email]);
          const email2 = this.normalizeForComparison(record2[fields.email]);
          if (email1 && email2 && email1 === email2) {
            highestScore = Math.max(highestScore, 95);
            matchedFields.push({ field: 'email', value1: record1[fields.email], value2: record2[fields.email], similarity: 100 });
          }
        }

        // Phone normalized match = 90
        if (fields.phone && record1[fields.phone] && record2[fields.phone]) {
          const phone1 = this.normalizePhone(record1[fields.phone]);
          const phone2 = this.normalizePhone(record2[fields.phone]);
          if (phone1 && phone2 && phone1 === phone2) {
            highestScore = Math.max(highestScore, 90);
            matchedFields.push({ field: 'phone', value1: record1[fields.phone], value2: record2[fields.phone], similarity: 100 });
          }
        }

        // Company name exact match = 85
        if (fields.companyName && record1[fields.companyName] && record2[fields.companyName]) {
          const company1 = this.normalizeForComparison(record1[fields.companyName]);
          const company2 = this.normalizeForComparison(record2[fields.companyName]);
          if (company1 && company2 && company1 === company2) {
            highestScore = Math.max(highestScore, 85);
            matchedFields.push({ field: 'companyName', value1: record1[fields.companyName], value2: record2[fields.companyName], similarity: 100 });
          }
        }
        break;
      }

      case 'opportunity': {
        // Opportunities: use name fuzzy matching as primary
        if (fields.name && record1[fields.name] && record2[fields.name]) {
          const nameSimilarity = this.fuzzyMatch(record1[fields.name], record2[fields.name]);
          if (nameSimilarity > 90) {
            highestScore = Math.max(highestScore, 85);
            matchedFields.push({ field: 'name', value1: record1[fields.name], value2: record2[fields.name], similarity: nameSimilarity });
          }
        }
        break;
      }
    }

    return { score: highestScore, matchedFields };
  }

  // ---- Find duplicates for a given record (pre-creation check) ----

  async findDuplicates(entityType: string, entityData: Record<string, any>) {
    const Model = entityModelMap[entityType];
    if (!Model) throw new Error(`Unsupported entity type: ${entityType}`);

    const fields = entityFieldMap[entityType];
    if (!fields) throw new Error(`No field mapping for entity type: ${entityType}`);

    // Build a broad WHERE to find candidates (email or phone or name match)
    const orConditions: unknown[] = [];

    if (fields.email && entityData[fields.email]) {
      orConditions.push({ [fields.email]: { [Op.iLike]: entityData[fields.email] } });
    }
    if (fields.phone && entityData[fields.phone]) {
      orConditions.push({ [fields.phone]: entityData[fields.phone] });
    }
    if (fields.companyName && entityData[fields.companyName]) {
      orConditions.push({ [fields.companyName]: { [Op.iLike]: `%${entityData[fields.companyName]}%` } });
    }
    if (fields.name && entityData[fields.name]) {
      orConditions.push({ [fields.name]: { [Op.iLike]: `%${entityData[fields.name]}%` } });
    }

    if (orConditions.length === 0) return [];

    const candidates = await Model.findAll({
      where: { [Op.or]: orConditions },
      limit: 50
    });

    const duplicates: Array<{ record: any; matchScore: number; matchedFields: any[] }> = [];

    for (const candidate of candidates) {
      const candidateData = candidate.toJSON();
      // Skip if comparing against itself
      if (entityData.id && candidateData.id === entityData.id) continue;

      const { score, matchedFields } = this.calculateMatchScore(entityData, candidateData, entityType);
      if (score >= 80) {
        duplicates.push({ record: candidateData, matchScore: score, matchedFields });
      }
    }

    // Sort by match score descending
    duplicates.sort((a, b) => b.matchScore - a.matchScore);
    return duplicates;
  }

  // ---- Batch scan for duplicates ----

  async scanForDuplicates(entityType: string) {
    const Model = entityModelMap[entityType];
    if (!Model) throw new Error(`Unsupported entity type: ${entityType}`);

    const records = await Model.findAll();
    const recordData = records.map((r: any) => r.toJSON());
    const detectedSets: Array<{ masterRecordId: string; duplicateRecordIds: string[]; matchScore: number; matchedFields: any[] }> = [];
    const processedPairs = new Set<string>();

    for (let i = 0; i < recordData.length; i++) {
      for (let j = i + 1; j < recordData.length; j++) {
        const pairKey = [recordData[i].id, recordData[j].id].sort().join('|');
        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);

        const { score, matchedFields } = this.calculateMatchScore(recordData[i], recordData[j], entityType);
        if (score >= 80) {
          // Check if this duplicate set already exists
          const existing = await DuplicateSet.findOne({
            where: {
              entityType,
              masterRecordId: recordData[i].id,
              status: { [Op.in]: [DuplicateStatus.DETECTED, DuplicateStatus.CONFIRMED] }
            }
          });

          if (!existing) {
            const _set = await DuplicateSet.create({
              entityType,
              masterRecordId: recordData[i].id,
              duplicateRecordIds: [recordData[j].id],
              matchScore: score,
              matchedFields,
              status: DuplicateStatus.DETECTED
            });
            detectedSets.push({
              masterRecordId: recordData[i].id,
              duplicateRecordIds: [recordData[j].id],
              matchScore: score,
              matchedFields
            });
          }
        }
      }
    }

    return {
      entityType,
      scanned: recordData.length,
      duplicatesFound: detectedSets.length,
      sets: detectedSets
    };
  }

  // ---- List duplicate sets with filters ----

  async getDuplicateSets(query: Record<string, unknown>) {
    const { page, limit, offset } = clampPagination(query, 30);
    const { entityType, status, sortBy = 'createdAt', sort = 'DESC' } = query;
    const where: Record<string, any> = {};
    if (entityType) where.entityType = entityType;
    if (status) where.status = status;
    const { rows, count } = await DuplicateSet.findAndCountAll({
      where,
      include: [{ model: User, as: 'resolver', attributes: ['id', 'name'] }],
      order: [[sortBy, sort]],
      limit,
      offset
    });

    return {
      docs: rows,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  // ---- Confirm duplicate ----

  async confirmDuplicate(setId: number, userId: number) {
    const set = await DuplicateSet.findByPk(setId);
    if (!set) throw new Error('Duplicate set not found');
    if (set.status !== DuplicateStatus.DETECTED) throw new Error('Can only confirm detected duplicates');

    return set.update({
      status: DuplicateStatus.CONFIRMED,
      resolvedBy: userId,
      resolvedAt: new Date()
    });
  }

  // ---- Dismiss duplicate ----

  async dismissDuplicate(setId: number, userId: number) {
    const set = await DuplicateSet.findByPk(setId);
    if (!set) throw new Error('Duplicate set not found');
    if (set.status === DuplicateStatus.MERGED) throw new Error('Cannot dismiss already merged records');

    return set.update({
      status: DuplicateStatus.DISMISSED,
      resolvedBy: userId,
      resolvedAt: new Date()
    });
  }

  // ---- Merge records ----

  async mergeRecords(setId: number, masterRecordId: string, userId: number) {
    const set = await DuplicateSet.findByPk(setId);
    if (!set) throw new Error('Duplicate set not found');
    if (set.status === DuplicateStatus.MERGED) throw new Error('Already merged');
    if (set.status === DuplicateStatus.DISMISSED) throw new Error('Cannot merge dismissed duplicates');

    const Model = entityModelMap[set.entityType];
    if (!Model) throw new Error(`Unsupported entity type: ${set.entityType}`);

    // Verify master record exists
    const masterRecord = await Model.findByPk(masterRecordId);
    if (!masterRecord) throw new Error('Master record not found');

    // Determine which records to merge (all IDs except the master)
    const allIds = [set.masterRecordId, ...set.duplicateRecordIds];
    const idsToMerge = allIds.filter(id => id !== masterRecordId);

    // Get master record data and merge non-empty fields from duplicates
    const masterData = masterRecord.toJSON() as Record<string, any>;
    const fields = entityFieldMap[set.entityType];

    for (const dupId of idsToMerge) {
      const dupRecord = await Model.findByPk(dupId);
      if (!dupRecord) continue;

      const dupData = dupRecord.toJSON() as Record<string, any>;

      // Fill empty fields in master with data from duplicate
      const fillableFields = fields ? Object.values(fields).filter(Boolean) : [];

      for (const field of fillableFields) {
        if ((!masterData[field] || masterData[field] === '') && dupData[field]) {
          masterData[field] = dupData[field];
        }
      }

      // Soft-merge: destroy the duplicate record
      await dupRecord.destroy();
    }

    // Update master record with merged data
    await masterRecord.update(masterData);

    // Update the duplicate set
    await set.update({
      masterRecordId,
      status: DuplicateStatus.MERGED,
      resolvedBy: userId,
      resolvedAt: new Date()
    });

    return {
      masterRecord: masterRecord.toJSON(),
      mergedIds: idsToMerge,
      set: set.toJSON()
    };
  }
}

export default new DuplicateService();
