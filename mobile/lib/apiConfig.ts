/**
 * Centralized API configurations
 */

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  ANALYZE: `${API_BASE_URL}/api/analyze`,
  LOG_MEAL: `${API_BASE_URL}/api/log`,
};
