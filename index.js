const SwaggerParser = require('@apidevtools/swagger-parser');
const fs = require('fs').promises;
const path = require('path');

/**
 * Dereferences an OpenAPI/Swagger YAML file
 * @param {string} inputPath - Path to the input YAML file
 * @param {string} [outputPath] - Optional path to save the dereferenced output
 * @param {object} [options] - Parser options
 * @returns {Promise<object>} - The dereferenced API definition
 */
async function dereferenceYaml(inputPath, outputPath = null, options = {}) {
  try {
    console.log(`Reading YAML file: ${inputPath}`);
    
    // Check if file exists
    const resolvedPath = path.resolve(inputPath);
    await fs.access(resolvedPath);
    
    // Default parser options
    const defaultOptions = {
      continueOnError: false,
      validate: {
        spec: true,
        schema: true
      },
      dereference: {
        circular: 'ignore' // Handle circular references
      },
      ...options
    };
    
    // Parse and dereference the API definition
    console.log('Parsing and dereferencing...');
    const api = await SwaggerParser.dereference(resolvedPath, defaultOptions);
    
    console.log(`✅ Successfully dereferenced API: ${api.info?.title || 'Unknown'} v${api.info?.version || 'Unknown'}`);
    
    // Save to output file if specified
    if (outputPath) {
      const outputData = JSON.stringify(api, null, 2);
      await fs.writeFile(outputPath, outputData, 'utf8');
      console.log(`📝 Dereferenced API saved to: ${outputPath}`);
    }
    
    return api;
    
  } catch (error) {
    console.error('❌ Error dereferencing YAML:', error.message);
    
    // Handle validation errors with more detail
    if (error.details) {
      console.error('Validation details:');
      error.details.forEach((detail, index) => {
        console.error(`  ${index + 1}. ${detail.message} at ${detail.path}`);
      });
    }
    
    throw error;
  }
}

/**
 * Alternative function using the bundle method (maintains $refs but bundles external files)
 */
async function bundleYaml(inputPath, outputPath = null, options = {}) {
  try {
    console.log(`Bundling YAML file: ${inputPath}`);
    
    const resolvedPath = path.resolve(inputPath);
    await fs.access(resolvedPath);
    
    const api = await SwaggerParser.bundle(resolvedPath, options);
    
    console.log(`✅ Successfully bundled API: ${api.info?.title || 'Unknown'} v${api.info?.version || 'Unknown'}`);
    
    if (outputPath) {
      const outputData = JSON.stringify(api, null, 2);
      await fs.writeFile(outputPath, outputData, 'utf8');
      console.log(`📝 Bundled API saved to: ${outputPath}`);
    }
    
    return api;
    
  } catch (error) {
    console.error('❌ Error bundling YAML:', error.message);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage: node index.js <input-yaml-file> [output-json-file] [--bundle]

Examples:
  node index.js api.yaml                    # Dereference and print to console
  node index.js api.yaml output.json        # Dereference and save to file
  node index.js api.yaml output.json --bundle # Bundle instead of dereference
    `);
    process.exit(1);
  }
  
  const inputPath = args[0];
  const outputPath = args[1];
  const shouldBundle = args.includes('--bundle');
  
  try {
    let result;
    
    if (shouldBundle) {
      result = await bundleYaml(inputPath, outputPath);
    } else {
      result = await dereferenceYaml(inputPath, outputPath);
    }
    
    // Print summary info
    console.log('\n📊 API Summary:');
    console.log(`   Title: ${result.info?.title || 'N/A'}`);
    console.log(`   Version: ${result.info?.version || 'N/A'}`);
    console.log(`   OpenAPI Version: ${result.openapi || result.swagger || 'N/A'}`);
    console.log(`   Paths: ${Object.keys(result.paths || {}).length}`);
    console.log(`   Components/Definitions: ${Object.keys(result.components?.schemas || result.definitions || {}).length}`);
    
  } catch (error) {
    console.error('Process failed:', error.message);
    process.exit(1);
  }
}

// Export functions for use as a module
module.exports = {
  dereferenceYaml,
  bundleYaml
};

// Run main function if this file is executed directly
if (require.main === module) {
  main();
}