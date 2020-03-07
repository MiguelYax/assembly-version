/*!
 * @author MYAX <mig_dj@hotmail.com>
 * date 03/06/2020
 * automatizacion de cambio de version para proyectos de c#
 * 
 */

const argv = require("yargs").argv;
const fs = require('fs');
const tagRegex = /\d+.\d+.\d+.\d+.\d+/g;
const AssemblyInfoFile = `${__dirname}/Properties/AssemblyInfo.cs`;
var AssemblyInfoContent = "";

function getGitParam(cmd) {
    return {
        args: cmd,
        quiet: true,
        log: false
    }
}

function parseAssemblyInfo(cb) {
    fs.readFile(AssemblyInfoFile, { encoding: "utf-8" }, function (err, data) {
        if (err) {
            throw err;
        }
        AssemblyInfoContent = data;

        let AssemblyVersionTag = AssemblyInfoContent.match(/AssemblyVersion\("\d+.\d+.\d+.\d+"\)/g),
            AssemblyFileVersionTag = AssemblyInfoContent.match(/AssemblyFileVersion\("\d+.\d+.\d+.\d+"\)/g);

        let AssemblyVersion = AssemblyVersionTag[0].match(tagRegex),
            AssemblyFileVersion = AssemblyFileVersionTag[0].match(tagRegex);

        console.log(AssemblyVersion, AssemblyFileVersion);

        cb(AssemblyVersion);
    });
}

function writeAssemblyInfo(oldVersion, newVersion, cb) {
    let oldAssemblyVersion = `AssemblyVersion\("${oldVersion}")`,
        oldAssemblyFileVersion = `AssemblyFileVersion\("${oldVersion}")`,
        newAssemblyVersion = `AssemblyVersion\("${newVersion}")`,
        newAssemblyFileVersion = `AssemblyFileVersion\("${newVersion}")`;

    let newAssemblyInfoContent = AssemblyInfoContent.replace(oldAssemblyVersion, newAssemblyVersion)
        .replace(oldAssemblyFileVersion, newAssemblyFileVersion);

    fs.writeFile(AssemblyInfoFile, newAssemblyInfoContent, function (err) {
        if (err) {
            throw err;
        }

        cb();
    });
}


function changeVersion(mode, message, cb) {
    parseAssemblyInfo(function (version) {
        let currentVersion = version;
        let newVersion = version.up(currentVersion, mode);
        let tMode = message || mode;
        util.log(
            "Change version",
            util.colors.blue(currentVersion),
            " to ",
            util.colors.green(newVersion)
        );
        git.exec(
            getGitParam('log -n 1 --format="%h"'),
            function (err, stdout) {
                let checksum = clear(stdout);
                writeAssemblyInfo(currentVersion, newVersion, function (err) {
                    if (err) {
                        throw err;
                    }
                    git.exec(getGitParam(`add  ${AssemblyInfoFile}`), (err, stdout, stderr) => {
                        if (err) {
                            throw err;
                        }
                        git.exec(getGitParam(`commit -m "Change version to: v${newVersion} Mode: ${tMode}" `), (err, stdout, stderr) => {
                            if (err) {
                                throw err;
                            }
                            createTag(checksum, newVersion, tMode, cb);
                        }
                        );
                    }
                    );
                });
            }
        );
    });
}



/**
 * createTag genera una etiqueta asociada al un identificador de commit
 */
function createTag(checksum, version, mode, cb) {
    let tag = "v" + version;
    git.exec(getGitParam(`tag -a  ${tag} ${checksum} -m "${mode}"`), (err, stdout, stderr) => {
        git.exec(getGitParam("push --tag"), (err, stdout, stderr) => {
            if (err) {
                util.log(util.colors.red(err.message));
                throw err;
            }
            git.exec(getGitParam("push"), (err, stdout, stderr) => {
                if (err) {
                    util.log(util.colors.red(err.message));
                    throw err;
                }
                util.log(util.colors.green("Success..."));
                cb();
            }
            );
        }
        );
    }
    );
}


function historyTags(cb) {
    let n = Number.isInteger(argv.n) ? argv.n : 10,
        s = argv.s || argv.search,
        search = s ? `-l "*${s}*"` : "";

    git.exec(getGitParam(`tag --sort=-taggerdate ${search} --format="%(tag), %(taggername), %(taggerdate), %(subject)" | head -n ${n}`), (error, stdout, stderr) => {
        if (error) {
            util.log(util.colors.red(error.message));
            return error;
        }
        let firstList = stdout.split("\n") || [];
        if (firstList[0]) {
            for (let index = 0; index < firstList.length; index++) {
                let tagInfo = firstList[index];
                let infoList = tagInfo.split(",");
                let vTag = infoList[0];
                let vMode = infoList[3] || "";
                let isRelease = ["production", "development"].includes(vMode.trim());
                if (vTag) {
                    console.log(
                        [
                            isRelease ? util.colors.green(vTag) : util.colors.magenta(vTag),
                            util.colors.cyan(vMode),
                            util.colors.yellow(infoList[1]),
                            util.colors.blue(infoList[2])
                        ].join("\t")
                    );
                }
            }
        } else {
            util.log(util.colors.yellow("No tags to show..."));
        }
        cb();
    }
    );
}