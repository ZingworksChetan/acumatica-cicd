'use strict';

const axios = require('axios');
const path = require('path');
const fs = require('fs');
const dotenv = require("dotenv");
dotenv.config();

let cookies;
const projectName = process.env.PROJECT_NAME;
const projectDescription = process.env.PROJECT_DESCRIPTION;
const projectLevel = process.env.PROJECT_LEVEL;
const version = process.env.npm_package_version;
const base_url = process.env.AC_BASE_URL;

async function loginToAcumatica() {
  const url = `${base_url}/entity/auth/login`;

  const data = {
    name: process.env.AC_USERNAME,
    password: process.env.AC_PASSWORD,
    locale: "EN-US"
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });

    if (response.status === 200 || response.status === 204) {
      console.log('Login successful!');
      cookies = response.headers['set-cookie'];

      if (!cookies || cookies.length === 0) {
        throw new Error('Login succeeded but no cookies were received.');
      }

      await importCustomization(cookies, `${projectName}[${version}]`, projectDescription, projectLevel);
      const projectNames = await getPublished(cookies, `${projectName}[${version}]`);
      
      if (projectNames) {
        await PublishBegin(cookies, projectNames);
        const isPublished = await checkPublishStatus(cookies);

        if (isPublished) {
          console.log("------Build publish Finished-------")
        } else {
          console.error('Publish failed or timed out.');
        }
      }
    } else {
      console.log('Login failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error logging in:', error.message);
    process.exit(1);
  }
}

async function getPublished(cookies, projectName) {
  const url = `${base_url}/CustomizationApi/GetPublished`;

  if (!Array.isArray(cookies) || cookies.length === 0) {
    console.error('Error: Cookies are missing or invalid in getPublished.');
    return null;
  }

  try {
    const response = await axios.post(url, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies.join('; ')
      }
    });

    if (response.status === 200) {
      console.log('getPublished successful!');
      let projectNames = response.data.projects.map(project => project.name);
      projectNames = projectNames.filter(project => !project.includes("USSFence"));
      projectNames.push(projectName);

      return projectNames.join(',');
    } else {
      console.log('getPublished failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error calling getPublished:', error.message);
  }

  return null;
}

async function PublishBegin(cookies, projectName) {
  const url = `${base_url}/CustomizationApi/PublishBegin`;

  const projectNamesArray = projectName
    .split(',')
    .map(item => item.trim());

  console.log("Formatted Project Array:", projectNamesArray);

  const requestData = {
    "isMergeWithExistingPackages": false,
    "isOnlyValidation": false,
    "isOnlyDbUpdates": false,
    "isReplayPreviouslyExecutedScripts": false,
    "projectNames": projectNamesArray,
    "tenantMode": "Current"
  };

  try {
    const response = await axios.post(url, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies.join('; '),
      }
    });

    if (response.status === 200) {
      console.log('PublishBegin successful:', response.data);
    } else {
      console.error(`Error: ${response.status} - ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error calling PublishBegin:', error.message);
  }
}

async function checkPublishStatus(cookies) {
  const url = `${base_url}/CustomizationApi/PublishEnd`;

  try {
      let isCompleted = false;
      let attempt = 0;
      let maxAttempts = 38; // Max 38 attempts (~30 min timeout)
      let delay = 120000; // Start with 2 min delay
      let startTime = Date.now();

      while (!isCompleted && attempt < maxAttempts) {
          const response = await axios.get(url, {
              headers: {
                  'Content-Type': 'application/json',
                  'Cookie': cookies.join('; '),
              },
          });

          if (response.status === 200) {
              isCompleted = response.data.isCompleted;
              console.log(`[Attempt ${attempt + 1}] Publish Status: Completed=${isCompleted}, Failed=${response.data.isFailed}`);

              if (isCompleted) {
                  let totalTime = Math.round((Date.now() - startTime) / 60000);
                  console.log(`Customization package published successfully in ${totalTime} minutes!`);
                  return true;
              }
          }

          // Adjust delay to increase frequency over time
          if (attempt >= 3 && attempt < 8) {
              delay = 60000; // After 3 attempts (~5 min), poll every 1 minute
          } else if (attempt >= 8 && attempt < 18) {
              delay = 30000; // After 8 attempts (~10 min), poll every 30 sec
          } else if (attempt >= 18) {
              delay = 15000; // After 18 attempts (~15 min), poll every 15 sec
          }

          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
      }

      console.error('Publishing timeout reached (30 min).');
      return false;

  } catch (error) {
      console.error('Error checking publish status:', error.message);
      return false;
  }
}


async function importCustomization(cookies, projectName, projectDescription, projectLevel) {
  const packagePath = path.resolve(`./build/${projectName}.zip`);

  if (!fs.existsSync(packagePath)) {
    console.error(`Error: File not found at path: ${packagePath}`);
    return;
  }

  const packageContent = fs.readFileSync(packagePath, { encoding: 'base64' });

  try {
    const response = await axios.post(`${base_url}/CustomizationApi/import`, {
      projectLevel,
      isReplaceIfExists: true,
      projectName,
      projectDescription,
      projectContentBase64: packageContent
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies.join('; ')
      }
    });

    if (response.status === 200 || response.status === 204) {
      console.log('Import successful!');
    } else {
      console.log('Import failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error calling import:', error.message);
  }
}

async function acumaticaLogout(cookies) {
  if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
    console.warn('Skipping logout: No valid cookies found.');
    return;
  }

  const url = `${base_url}/entity/auth/logout`;

  try {
    const response = await axios.post(url, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies.join('; ')
      }
    });

    if (response.status === 200 || response.status === 204) {
      console.log('Logout successful!');
    } else {
      console.log('Logout failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error calling logout:', error.message);
  }
}

// Start the process
loginToAcumatica();