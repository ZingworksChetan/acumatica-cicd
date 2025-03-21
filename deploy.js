'use strict';

const axios = require('axios');
const path = require('path');
const fs = require('fs');
const dotenv = require("dotenv");
dotenv.config();

let cookies; // Store cookies for session tracking
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
      console.log('Set-Cookie values:', cookies);

      if (!cookies || cookies.length === 0) {
        throw new Error('Login succeeded but no cookies were received.');
      }

      //Call required functions after successful login
     await importCustomization(cookies, `${projectName}[${version}]`, projectDescription, projectLevel);
     await getPublished(cookies,`${projectName}[${version}]`);  
    // await PublishBegin(cookies,`${projectName}[${version}]`);    
     // await acumaticaLogout(cookies);

    } else {
      console.log('Login failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error logging in:', error.message);
   // await acumaticaLogout(cookies);
    process.exit(1);
  }
}

async function getPublished(cookies, projectName) {
  const url = `${base_url}/CustomizationApi/GetPublished`;

  if (!Array.isArray(cookies) || cookies.length === 0) {
    console.error('Error: Cookies are missing or invalid in getPublished.');
    return;
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
      var projectNames = response.data.projects.map(project => project.name); 
      projectNames = projectNames.filter(project => !project.includes("USSFence"));  
      projectNames+= ","+projectName;

     await PublishBegin(cookies,projectNames);
      return projectNames;

    } else {
      console.log('getPublished failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error calling getPublished:', error.message);
  }
}



async function PublishBegin(cookies,projectName) {
  const url = `${base_url}/CustomizationApi/PublishBegin`;

  const projectNamesArray = projectName
  .split(',')              // Split the string into an array
  .map(item => item.trim()); // Trim spaces to ensure clean entries
  console.log("Formatted Array:", projectNamesArray);

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
      console.error('Error calling publishBegin:', error.message);
      if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Status code:', error.response.status);
      }
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
      console.log('Data:', response.data);
    } else {
      console.log('Import failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error calling import:', error.message);
  }
}

// async function acumaticaLogout(cookies) {
//   if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
//       console.warn('Skipping logout: No valid cookies found.');
//       return;
//   }

//   const url = `${base_url}/entity/auth/logout`;

//   try {
//       const response = await axios.post(url, {}, {
//           headers: {
//               'Content-Type': 'application/json',
//               'Cookie': cookies.join('; ')
//           }
//       });

//       if (response.status === 200 || response.status === 204) {
//           console.log('Logout successful!');
//       } else {
//           console.log('Logout failed:', response.status, response.statusText);
//       }
//   } catch (error) {
//       console.error('Error calling logout:', error.message);
//   }
// }


// Start the process
loginToAcumatica();


//=======+++++++++++++============++++++++++++++===============++++++++++

// 'use strict';

// const axios = require('axios');
// const path = require('path');
// const fs = require('fs');
// const dotenv = require("dotenv");
// dotenv.config();

// let cookies; // Store cookies for session tracking
// const projectName = process.env.PROJECT_NAME;
// const projectDescription = process.env.PROJECT_DESCRIPTION;
// const projectLevel = process.env.PROJECT_LEVEL;
// const version = process.env.npm_package_version;
// const base_url = process.env.AC_BASE_URL;

// async function loginToAcumatica() {
//   const url = `${base_url}/entity/auth/login`;
  
//   const data = {
//     name: process.env.AC_USERNAME,
//     password: process.env.AC_PASSWORD,
//     locale: "EN-US"
//   };

//   try {
//     const response = await axios.post(url, data, {
//       headers: {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json',     
//       }
//     });

//     if (response.status === 200 || response.status === 204) {
//       console.log('Login successful!');
//       cookies = response.headers['set-cookie'];
//       console.log('Set-Cookie values:', cookies);

//       if (!cookies || cookies.length === 0) {
//         throw new Error('Login succeeded but no cookies were received.');
//       }

//       //Call required functions after successful login
//      await importCustomization(cookies, `${projectName}[${version}]`, projectDescription, projectLevel);
//      await getPublished(cookies,`${projectName}[${version}]`);  
//     // await PublishBegin(cookies,`${projectName}[${version}]`);    
//      // await acumaticaLogout(cookies);

//     } else {
//       console.log('Login failed:', response.status, response.statusText);
//     }
//   } catch (error) {
//     console.error('Error logging in:', error.message);
//     await acumaticaLogout(cookies);
//     process.exit(1);
//   }
// }

// async function getPublished(cookies, projectName) {
//   const url = `${base_url}/CustomizationApi/GetPublished`;

//   if (!Array.isArray(cookies) || cookies.length === 0) {
//     console.error('Error: Cookies are missing or invalid in getPublished.');
//     return;
//   }

//   try {
//     const response = await axios.post(url, {}, {
//       headers: {
//         'Content-Type': 'application/json',
//         'Cookie': cookies.join('; ')
//       }
//     });

//     if (response.status === 200) {
//       console.log('getPublished successful!');
//       var projectNames = response.data.projects.map(project => project.name); 
//       projectNames = projectNames.filter(project => !project.includes("USSFence"));  
//       projectNames+= ","+projectName;

//      PublishBegin(cookies,projectNames);
//       return projectNames;

//     } else {
//       console.log('getPublished failed:', response.status, response.statusText);
//     }
//   } catch (error) {
//     console.error('Error calling getPublished:', error.message);
//   }
// }



// async function PublishBegin(cookies,projectName) {
//   const url = `${base_url}/CustomizationApi/PublishBegin`;

//   const projectNamesArray = projectName
//   .split(',')              // Split the string into an array
//   .map(item => item.trim()); // Trim spaces to ensure clean entries
//   console.log("Formatted Array:", projectNamesArray);

//   const requestData = {
//       "isMergeWithExistingPackages": false,
//       "isOnlyValidation": false,
//       "isOnlyDbUpdates": false,
//       "isReplayPreviouslyExecutedScripts": false,
//       "projectNames": projectNamesArray,
//       "tenantMode": "Current"
//   };

//   try {
//       const response = await axios.post(url, requestData, {
//           headers: {
//               'Content-Type': 'application/json',
//               'Cookie': cookies.join('; '),
//           }
//       });

//       if (response.status === 200) {
//           console.log('PublishBegin successful:', response.data);
//       } else {
//           console.error(`Error: ${response.status} - ${response.statusText}`);
//       }
//   } catch (error) {
//       console.error('Error calling publishBegin:', error.message);
//       if (error.response) {
//           console.error('Response data:', error.response.data);
//           console.error('Status code:', error.response.status);
//       }
//   }
// }

// async function importCustomization(cookies, projectName, projectDescription, projectLevel) {
//   const packagePath = path.resolve(`./build/${projectName}.zip`);
  
//   if (!fs.existsSync(packagePath)) {
//     console.error(`Error: File not found at path: ${packagePath}`);
//     return;
//   }

//   const packageContent = fs.readFileSync(packagePath, { encoding: 'base64' });

//   try {
//     const response = await axios.post(`${base_url}/CustomizationApi/import`, {
//       projectLevel,
//       isReplaceIfExists: true,
//       projectName,
//       projectDescription,
//       projectContentBase64: packageContent
//     }, {
//       headers: {
//         'Content-Type': 'application/json',
//         'Cookie': cookies.join('; ')
//       }
//     });

//     if (response.status === 200 || response.status === 204) {
//       console.log('Import successful!');
//       console.log('Data:', response.data);
//     } else {
//       console.log('Import failed:', response.status, response.statusText);
//     }
//   } catch (error) {
//     console.error('Error calling import:', error.message);
//   }
// }

// // async function acumaticaLogout(cookies) {
// //   if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
// //       console.warn('Skipping logout: No valid cookies found.');
// //       return;
// //   }

// //   const url = `${base_url}/entity/auth/logout`;

// //   try {
// //       const response = await axios.post(url, {}, {
// //           headers: {
// //               'Content-Type': 'application/json',
// //               'Cookie': cookies.join('; ')
// //           }
// //       });

// //       if (response.status === 200 || response.status === 204) {
// //           console.log('Logout successful!');
// //       } else {
// //           console.log('Logout failed:', response.status, response.statusText);
// //       }
// //   } catch (error) {
// //       console.error('Error calling logout:', error.message);
// //   }
// // }


// // Start the process
// loginToAcumatica();