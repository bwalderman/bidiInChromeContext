/**
 * Copyright 2021 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Copied form Puppeteer
`use strict`;
import childProcess from 'child_process';
import readline from 'readline';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const mkdtempAsync = promisify(fs.mkdtemp);

export default async function launch() {
  const tempDir = await getTempDir();
  const browserExecutablePath = process.env.BROWSER_PATH;
  const headless = process.env.HEADLESS !== 'false';

  const processFlags = [
    '--disable-background-networking',
    '--enable-features=NetworkService,NetworkServiceInProcess',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-client-side-phishing-detection',
    '--disable-component-extensions-with-background-pages',
    '--disable-default-apps',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--disable-features=TranslateUI',
    '--disable-hang-monitor',
    '--disable-ipc-flooding-protection',
    '--disable-popup-blocking',
    '--disable-prompt-on-repost',
    '--disable-renderer-backgrounding',
    '--disable-sync',
    '--force-color-profile=srgb',
    '--metrics-recording-only',
    '--no-first-run',
    '--enable-automation',
    '--password-store=basic',
    '--use-mock-keychain',
    '--enable-blink-features=IdleDetection',
    '--remote-debugging-port=0',
    '--user-data-dir=' + tempDir,
    'about:blank',
  ];

  if (headless) processFlags.push('--headless');

  const proc = childProcess.spawn(browserExecutablePath, processFlags);
  return {
    cdpUrl: await waitForWSEndpoint(proc),
    closeBrowser: () => {
      proc.kill();
    },
  };
}

async function getTempDir() {
  const profilePath = path.join(os.tmpdir(), 'bidi_mapper_profiles_');
  return await mkdtempAsync(profilePath);
}

function waitForWSEndpoint(browserProcess) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: browserProcess.stderr });
    addEventListener(rl, 'line', onLine);

    function onLine(line) {
      const match = line.match(/^DevTools listening on (ws:\/\/.*)$/);
      if (!match) return;
      resolve(match[1]);
    }
  });
}

function addEventListener(emitter, eventName, handler) {
  emitter.on(eventName, handler);
  return { emitter, eventName, handler };
}
