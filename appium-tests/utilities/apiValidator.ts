import axios, { AxiosResponse } from 'axios';
import { logger } from './logger';
import { API_CONFIG } from '../test-data/testData';

interface ApiValidationResult {
  url: string;
  method: string;
  statusCode: number;
  responseTime: number;
  passed: boolean;
  errors: string[];
}

const results: ApiValidationResult[] = [];

export async function validateApi(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  options: {
    token?: string;
    body?: object;
    expectedStatus?: number;
    maxResponseTime?: number;
    validateBody?: (data: any) => string[];
  } = {}
): Promise<ApiValidationResult> {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  const { token, body, expectedStatus = 200, maxResponseTime = 5000, validateBody } = options;
  const errors: string[] = [];
  const start = Date.now();

  let response: AxiosResponse | null = null;
  let statusCode = 0;

  try {
    response = await axios({
      method,
      url,
      data: body,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: API_CONFIG.timeout,
      validateStatus: () => true,
    });
    statusCode = response.status;
  } catch (err: any) {
    errors.push(`Request failed: ${err.message}`);
  }

  const responseTime = Date.now() - start;

  if (statusCode !== expectedStatus) {
    errors.push(`Expected status ${expectedStatus}, got ${statusCode}`);
  }
  if (responseTime > maxResponseTime) {
    errors.push(`Response time ${responseTime}ms exceeded limit ${maxResponseTime}ms`);
  }
  if (response && validateBody) {
    const bodyErrors = validateBody(response.data);
    errors.push(...bodyErrors);
  }

  const result: ApiValidationResult = {
    url, method, statusCode, responseTime,
    passed: errors.length === 0,
    errors,
  };

  results.push(result);
  logger.info(`API [${method}] ${endpoint} → ${statusCode} (${responseTime}ms) ${result.passed ? '✓' : '✗'}`);
  if (errors.length) errors.forEach(e => logger.error(`  ↳ ${e}`));

  return result;
}

export function getApiResults() { return results; }
export function clearApiResults() { results.length = 0; }
