const fs = require('fs');
const pdf = require('pdf-parse');
const dataBuffer = fs.readFileSync('Documento/main.pdf');
pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('main_extracted.txt', data.text);
    console.log("Extracted successfully.");
}).catch(console.error);
