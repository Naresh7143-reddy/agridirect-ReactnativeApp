import path from 'path';
import fs from 'fs-extra';
import { logger } from './logger';

const screenshotsDir = path.resolve(__dirname, '../screenshots');
fs.ensureDirSync(screenshotsDir);

export async function takeScreenshot(name: string, category = 'general'): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const clean = name.replace(/\s+/g, '_').replace(/[^\w-]/g, '').slice(0, 60);
  const filename = `${category}_${clean}_${timestamp}.png`;
  const filepath = path.join(screenshotsDir, filename);

  await browser.saveScreenshot(filepath);
  logger.info(`Screenshot saved: ${filename}`);
  return filepath;
}

export async function takeStepScreenshot(step: string): Promise<string> {
  return takeScreenshot(step, 'step');
}

export async function takeFailureScreenshot(testName: string): Promise<string> {
  return takeScreenshot(testName, 'FAIL');
}

export async function captureDeviceLogs(): Promise<string> {
  try {
    const logs = await browser.getLogs('logcat');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logsDir = path.resolve(__dirname, '../logs');
    const logFile = path.join(logsDir, `device_${timestamp}.log`);
    const content = logs.map((l: any) => `[${l.level}] ${l.message}`).join('\n');
    await fs.writeFile(logFile, content);
    logger.info(`Device logs captured: ${logFile}`);
    return logFile;
  } catch (e) {
    logger.warn('Could not capture device logs');
    return '';
  }
}
