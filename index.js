const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');

module.exports = () => {
    http.createServer((req, res) => {
        const dirPath = path.join(__dirname, 'files');
        const logsPath = path.join(__dirname, 'logs.json');
        const data = fs.readFileSync(logsPath);
        const logs = JSON.parse(data.toString());
        const {pathname, query} = url.parse(req.url, true);
        switch (req.method) {
            case 'POST':
                try {
                    if (path.extname(query.filename.toString()) !== '.txt') {
                        // noinspection JSPrimitiveTypeWrapperUsage
                        query.filename += '.txt';
                    }
                    fs.writeFile(`${dirPath}/${query.filename}`, query.content, err => {
                        if (err) throw err;
                        logs.logs.push({
                            message: `New file with name '${query.filename}' saved`,
                            time: Date.now(),
                        })
                        fs.writeFileSync(logsPath, JSON.stringify(logs));
                        res.writeHead(200, {
                            "Content-Type": "text/html",
                        })
                        res.end("File was successfully written.");
                    })
                } catch (err) {
                    res.writeHead(400, {
                        "Content-Type": "text/html",
                    })
                    logs.logs.push({
                        message: `Bad params! Use filename and content!`,
                        time: Date.now(),
                    })
                    fs.writeFileSync(logsPath, JSON.stringify(logs));
                    res.end("<h1>Bad request!</h1>>")
                }
                break
            case 'GET':
                if (pathname.includes("file")) {
                    const filename = pathname.split(':')[1];
                    fs.readFile(`${dirPath}/${filename}`, (err, data) => {
                        if (err) {
                            logs.logs.push({
                                message: `File was not read due to error`,
                                time: Date.now(),
                            })
                            fs.writeFileSync(logsPath, JSON.stringify(logs));
                            res.writeHead(200, {
                                "Content-Type": "text/html",
                            })
                            res.end(err.toString())
                        }
                        logs.logs.push({
                            message: `File with name '${filename}' was read`,
                            time: Date.now(),
                        })
                        fs.writeFileSync(logsPath, JSON.stringify(logs));
                        res.writeHead(200, {
                            "Content-Type": "text/html",
                        })
                        res.end(data)
                    });
                } else {
                    if (query.from && query.to) {
                        let timeLogs = logs.logs.filter(log => log.time >= query.from && log.time <= query.to);
                        let jsonLogs = {
                            "logs": timeLogs
                        }
                        res.writeHead(200, {
                            "Content-Type": "text/html",
                        })
                        res.end(JSON.stringify(jsonLogs));
                    }
                    res.writeHead(200, {
                        "Content-Type": "text/html",
                    })
                    res.end(JSON.stringify(logs));
                }
                break
            default:
                res.end("Wrong request")
        }
    }).listen(3000, () => {
        console.log("Server has been started");
    });

}

