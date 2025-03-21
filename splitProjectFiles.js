const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

// Read the project.xml file
const xmlFilePath = './build/project.xml';
const xmlData = fs.readFileSync(xmlFilePath, 'utf8');

// Parse the XML data
xml2js.parseString(xmlData, (err, result) => {
    if (err) {
        console.error('Error parsing XML:', err);
        return;
    }

    // Extract BPEvents
    const bpEvents = result.Customization.BpEvent;
    const genericInquiryScreens = result.Customization.GenericInquiryScreen;
    const XportScenarios = result.Customization.XportScenario;

    // Write each BPEvent to a separate file
    bpEvents && bpEvents.forEach((bpEvent, index) => { 
        const filename = (bpEvent["data-set"][0].data[0].BPEvent[0].row[0].$.Name).replace(/ /g, "_");
        const bpEventXml = new xml2js.Builder({headless: true}).buildObject({ BpEvent: bpEvent });
        const outputFilePath = path.join('bp-event', `BPEvent_${filename}.xml`);
        fs.writeFileSync(outputFilePath, bpEventXml, 'utf8');
        console.log(`${outputFilePath} created successfully.`);
    });
    genericInquiryScreens && genericInquiryScreens.forEach((giScreen, index) => { 
        const filename = (giScreen["data-set"][0].data[0].GIDesign[0].row[0].$.Name).replace(/ /g, "_");
        
        const outputFilePath = path.join('generic-inquiries', `${filename}.xml`);
        if (fs.existsSync(outputFilePath)) {
            console.log('File exists, skipping processing.');
            const xmlData = new xml2js.Builder({headless: true}).buildObject({ GenericInquiryScreen: giScreen });
            // Add your file processing logic here
            fs.writeFileSync(outputFilePath, xmlData, 'utf8');
            console.log(`${outputFilePath} created successfully.`);
        } else {
            console.log('File does not exist, proceeding with processing.');
            const xmlData = new xml2js.Builder({headless: true}).buildObject({ GenericInquiryScreen: giScreen });
            // Add your file processing logic here
            fs.writeFileSync(outputFilePath, xmlData, 'utf8');
            console.log(`${outputFilePath} created successfully.`);
        }
    });
    XportScenarios && XportScenarios.forEach((xportScenario, index) => { 
        // XportScenarios[0]["data-set"][0].data[0].SYMapping[0].row[0].$.Name
        const filename = (xportScenario["data-set"][0].data[0].SYMapping[0].row[0].$.Name).replace(/ /g, "_");
        const xmlData = new xml2js.Builder({headless: true}).buildObject({ XportScenario: xportScenario });
        const outputFilePath = path.join('export-scenario', `export_${filename}.xml`);
        fs.writeFileSync(outputFilePath, xmlData, 'utf8');
        console.log(`${outputFilePath} created successfully.`);
    });
});

console.log('All BPEvents have been processed.');