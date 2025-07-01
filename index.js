const $RefParser = require('@apidevtools/json-schema-ref-parser');
const YAML = require('yaml');
const fs = require('fs');

// Get CLI arguments
const [,, inputFile, outputFile] = process.argv;

if (!inputFile || !outputFile) {
  console.error('Usage: node index.js <input-file> <output-file>');
  process.exit(1);
}

(async () => {
  try {
    const dereferenced = await $RefParser.dereference(inputFile);
    const yamlOutput = YAML.stringify(dereferenced);
    fs.writeFileSync(outputFile, yamlOutput);
    console.log(`Dereferenced spec written to ${outputFile}`);
  } catch (error) {
    console.error('Error dereferencing the spec:', error);
    process.exit(1);
  }
})();
