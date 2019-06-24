const fs = require('fs');
const path = require('path');
const endOfLine = require('os').EOL;

const buildName = 'build/bundle.js';
const watchDir = path.join(__dirname, 'files');
const currentFiles = fs.readdirSync(watchDir);

const getData = (files) =>
    Promise.all(files.map(fileName =>
            new Promise((resolve, reject) =>
                fs.readFile(watchDir + '/' + fileName, (err, data) => {
                    return err ? reject(err) : resolve(data);
                })
            )
        )
    );

const writeData = (filesData) =>
    new Promise((resolve, reject) =>
        fs.writeFile(buildName, filesData.join(endOfLine), (err) => {
            if (err) {
                reject(err)
            }
        })
    );

const appendData = (content) =>
    new Promise((resolve, reject) =>
        fs.appendFile(buildName, content, (err) => {
            if (err) {
                reject(err)
            }
        })
    );

const getFiles = () =>
    new Promise((resolve, reject) =>
        fs.readdir(watchDir, (err, files) => {
            const jsFiles = files.filter(file => file.slice(-3) === '.js');

            return err ? reject(err) : resolve(jsFiles);
        })
    );

fs.watch(watchDir, (eventType, filename) => {
    if (eventType === 'rename') {
        const index = currentFiles.indexOf(filename);

        if (index === -1) {
            console.log('new file');
            currentFiles.push(filename);
            getData([filename])
                .then(appendData)
                .catch(reason => console.log('Something went wrong:' + reason));

            return;
        } else {
            currentFiles.splice(index, 1);
        }
    }

    getFiles()
        .then(getData)
        .then(writeData)
        .catch(reason => console.log('Something went wrong:' + reason));
});