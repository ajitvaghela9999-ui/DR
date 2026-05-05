
const fs = require('fs');
try {
    const content = fs.readFileSync('build_error.txt', 'utf16le');
    console.log(content);
} catch (e) {
    console.log(fs.readFileSync('build_error.txt', 'utf8'));
}
