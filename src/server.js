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
`use strict`;

import browserLauncher from './browserLauncher.js';
import mapperReader from './mapperReader.js';
import { MapperServer } from './mapperServer.js';
import { BidiServerRunner } from './bidiServerRunner.js';

(async () => {
  try {
    BidiServerRunner.run(
      async (bidiServer) => {
        // Launch browser.
        const { cdpUrl, closeBrowser } = await browserLauncher();
        // Get BiDi Mapper script.
        const bidiMapperScript = await mapperReader();

        // Run BiDi Mapper script on the browser.
        const mapperServer = await MapperServer.create(
          cdpUrl,
          bidiMapperScript
        );

        // Forward messages from BiDi Mapper to the client.
        mapperServer.setOnMessage(async (message) => {
          await bidiServer.sendMessage(message);
        });

        // Forward messages from the client to BiDi Mapper.
        bidiServer.setOnMessage(async (message) => {
          await mapperServer.sendMessage(message);
        });

        // Save handler `closeBrowser` to use after the client disconnected.
        return { closeBrowser };
      },
      ({ closeBrowser }) => {
        // Client disconnected. Close browser.
        closeBrowser();
      }
    );
  } catch (e) {
    console.log('Error', e);
  }
})();
