const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'priya', 'priyanshu', 'projects', 'fitness_ecom', 'components', 'store', 'ProductDetailClient.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('<Star')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
