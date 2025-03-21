const fs = require('fs');
var args = require('minimist')(process.argv.slice(2));

// -p = project name
const project = args.p || 'project';
// -v = version
const version = process.env.npm_package_version;
const projectVersion = `${project}[${version}]`;

// array of folders to build
const folders = ['generic-inquiries', 'reports', 'bp-event', `export-scenario`] // removing 'screens','site-map-nodes' for now
// location of the build folder
const build = './build'
// if the build folder does not exist, create it
if (!fs.existsSync(build)) {
    fs.mkdirSync(build)
}
// delete any files in the build folder
fs.readdirSync(build).forEach(file => {
    fs.unlinkSync(build + '/' + file)
})
// create an xml document in memory from the shell xml
let customizationXML = '<Customization level="250" description="USS Fence" product-version="24.110">'
// iterate through each file in the folders in the folders array read in the xml
folders.forEach(folder => {
  // for each file in the folder, read in the xml and add it to the xml document
    fs.readdirSync(`./${folder}`).forEach(file => {
        const elementXML = fs.readFileSync(`./${folder}/${file}`, 'utf8');
        customizationXML += '\n';
        customizationXML += elementXML;
    })
});
// close the xml document
customizationXML += '\n</Customization>'
// write to the build folder
fs.writeFileSync(`${build}/project.xml`, customizationXML)
// zip the project file in the folder
const zip = require('adm-zip');
const zipFile = new zip();
zipFile.addLocalFile(`${build}/project.xml`);
zipFile.writeZip(`${build}/${projectVersion}.zip`);

