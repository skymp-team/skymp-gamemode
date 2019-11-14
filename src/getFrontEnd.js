let fs = require('fs');

async function getFrontEnd(frontDir) {
  let readDir = require("recursive-readdir");

  let files = await new Promise((resolve, reject) => {
    readDir(frontDir, (err, files) => {
      err ? reject(err) : resolve(files);
    });
  });

  let frontEnd = {};
  files.forEach(f => {
    let key = f.substr(frontDir.length + 1);
    frontEnd[key] = fs.readFileSync(f);
  });
  return frontEnd;
};

module.exports = getFrontEnd;
