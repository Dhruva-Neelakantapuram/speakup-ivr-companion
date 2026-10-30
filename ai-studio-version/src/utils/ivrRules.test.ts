import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSensitiveCategory,
  routeComplaint,
  isTicketOverdue,
  calculateSupervisorMetrics,
  checkSafetyRewardEligibility,
} from './ivrRules';
import { Category, Supervisor, Ticket } from '../types';

const mockSupervisors: Supervisor[] = [
  {
    id: 'sup-1',
    name: 'Rajesh Kumar',
    factoryId: 'factory-chennai',
    department: 'Sewing / Maintenance',
    resolvedCount: 8,
    totalAssigned: 10,
    avgTimeHours: 12.5,
    ratings: [5, 4, 5, 5, 4, 5], // 6 ratings >= 5
  },
  {
    id: 'sup-2',
    name: 'Murugan S.',
    factoryId: 'factory-sricity',
    department: 'Assembly',
    resolvedCount: 3,
    totalAssigned: 6,
    avgTimeHours: 20.0,
    ratings: [4, 5, 3], // Only 3 ratings (< 5)
  },
];

test('isSensitiveCategory correctly identifies sensitive categories', () => {
  assert.equal(isSensitiveCategory('wages'), true);
  assert.equal(isSensitiveCategory('harassment'), true);
  assert.equal(isSensitiveCategory('supervisor'), true);
  assert.equal(isSensitiveCategory('safety'), false);
  assert.equal(isSensitiveCategory('hostel'), false);
});

test('routeComplaint isolates sensitive categories from supervisors', () => {
  const wageRouting = routeComplaint('wages', 'factory-chennai', mockSupervisors);
  assert.equal(wageRouting.isSensitive, true);
  assert.equal(wageRouting.assignedSupervisorId, null);

  const harassmentRouting = routeComplaint('harassment', 'factory-sricity', mockSupervisors);
  assert.equal(harassmentRouting.isSensitive, true);
  assert.equal(harassmentRouting.assignedSupervisorId, null);

  const supervisorRouting = routeComplaint('supervisor', 'factory-chennai', mockSupervisors);
  assert.equal(supervisorRouting.isSensitive, true);
  assert.equal(supervisorRouting.assignedSupervisorId, null);
});

test('routeComplaint assigns operational tickets to local supervisors with proper SLA', () => {
  const safetyRouting = routeComplaint('safety', 'factory-chennai', mockSupervisors);
  assert.equal(safetyRouting.isSensitive, false);
  assert.equal(safetyRouting.assignedSupervisorId, 'sup-1');
  assert.equal(safetyRouting.deadlineHours, 24); // 24h urgent safety SLA

  const hostelRouting = routeComplaint('hostel', 'factory-chennai', mockSupervisors);
  assert.equal(hostelRouting.isSensitive, false);
  assert.equal(hostelRouting.assignedSupervisorId, 'sup-1');
  assert.equal(hostelRouting.deadlineHours, 48); // 48h standard SLA
});

test('isTicketOverdue detects auto-escalation condition', () => {
  const activeTicket: Ticket = {
    id: 101,
    factoryId: 'factory-chennai',
    lineOrArea: 'Line 1',
    category: 'hostel',
    originalVoiceText: 'Tap leaking',
    translatedText: 'Tap leaking',
    language: 'odia',
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    deadlineHours: 48,
    remainingHours: 12,
    assignedSupervisorId: 'sup-1',
    reporterWorkerId: 'W101',
    isSensitive: false,
    isSafetyVerified: false,
    isFirstReport: false,
    workerConfirmed: false,
  };

  assert.equal(isTicketOverdue(activeTicket), false);

  const overdueTicket: Ticket = {
    ...activeTicket,
    remainingHours: 0,
  };
  assert.equal(isTicketOverdue(overdueTicket), true);

  const resolvedTicket: Ticket = {
    ...overdueTicket,
    status: 'resolved',
  };
  assert.equal(isTicketOverdue(resolvedTicket), false);
});

test('calculateSupervisorMetrics shows rating ONLY when count is >= 5', () => {
  const tickets: Ticket[] = [];

  // sup-1 has 6 ratings -> averageRating should be visible
  const stats1 = calculateSupervisorMetrics(mockSupervisors[0], tickets);
  assert.notEqual(stats1.averageRating, null);
  assert.equal(typeof stats1.averageRating, 'number');
  assert.ok(stats1.averageRating! >= 4.0);

  // sup-2 has 3 ratings (< 5) -> averageRating MUST be null
  const stats2 = calculateSupervisorMetrics(mockSupervisors[1], tickets);
  assert.equal(stats2.averageRating, null);
  assert.equal(stats2.ratingsCount, 3);
});

test('checkSafetyRewardEligibility rewards first reporter of safety hazard only', () => {
  const rameshTicket: Ticket = {
    id: 4579,
    factoryId: 'factory-chennai',
    lineOrArea: 'Line 3, Machine 12',
    category: 'safety',
    originalVoiceText: 'Sparking sewing machine',
    translatedText: 'Sparking sewing machine',
    language: 'odia',
    status: 'new',
    createdAt: '2026-10-29T10:00:00Z',
    deadlineHours: 24,
    remainingHours: 24,
    assignedSupervisorId: 'sup-1',
    reporterWorkerId: 'W123',
    isSensitive: false,
    isSafetyVerified: true,
    isFirstReport: true,
    workerConfirmed: false,
  };

  const wageTicket: Ticket = {
    ...rameshTicket,
    category: 'wages',
  };

  // Wages do not earn safety reward
  const wageReward = checkSafetyRewardEligibility(wageTicket, [rameshTicket]);
  assert.equal(wageReward.isEligible, false);

  // Ramesh is the first reporter -> eligible
  const rameshReward = checkSafetyRewardEligibility(rameshTicket, []);
  assert.equal(rameshReward.isEligible, true);
  assert.equal(rameshReward.points, 500);
  assert.equal(rameshReward.amountInr, 250);

  // Second reporter for same machine later -> NOT eligible for duplicate
  const duplicateTicket: Ticket = {
    ...rameshTicket,
    id: 4580,
    reporterWorkerId: 'W400',
    createdAt: '2026-10-29T11:00:00Z',
  };
  const duplicateReward = checkSafetyRewardEligibility(duplicateTicket, [rameshTicket]);
  assert.equal(duplicateReward.isEligible, false);
});
