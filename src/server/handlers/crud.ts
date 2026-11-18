/**
 * Shared validation logic for POST/PUT request bodies.
 * Checks required, type, enum, min/max constraints from field rules.
 */

import type { Resource, FieldRule } from '../../types/config.js';

export function validateBody(
  body: Record<string, unknown>,
  definition: Resource,
): string[] {
  const errors: string[] = [];

  if (!definition.fields) return errors;

  for (const [field, rule] of Object.entries(definition.fields)) {
    // Skip auto-generated fields (like id)
    if (rule.auto) continue;

    const value = body[field];

    // Required check
    if (rule.required && (value === undefined || value === null)) {
      errors.push(`"${field}" is required`);
      continue;
    }

    // Skip remaining checks if value is absent and not required
    if (value === undefined || value === null) continue;

    // Type check
    if (!checkType(value, rule.type)) {
      errors.push(`"${field}" must be of type ${rule.type}`);
      continue;
    }

    // Enum check
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push(`"${field}" must be one of: ${rule.enum.join(', ')}`);
    }

    // Min/max for numbers
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`"${field}" must be >= ${rule.min}`);
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push(`"${field}" must be <= ${rule.max}`);
      }
    }

    // Min/max for strings (length)
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.min !== undefined && value.length < rule.min) {
        errors.push(`"${field}" must be at least ${rule.min} characters`);
      }
      if (rule.max !== undefined && value.length > rule.max) {
        errors.push(`"${field}" must be at most ${rule.max} characters`);
      }
    }
  }

  return errors;
}

function checkType(value: unknown, type: FieldRule['type']): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    default:
      return true;
  }
}
