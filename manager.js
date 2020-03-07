/**
 * @copyright  Miguel Yax 2020  
 */

/*!
 * @author MYAX <mig_dj@hotmail.com>
 * date 03/06/2020
 * Update Assembly Version tag for c# proyects.
 * 
 */

const argv = require("yargs").argv;
const fs = require('fs');
const git = require("gulp-git");
const util = require("gulp-util");
const version = require("pa-dss-version");

//    /**
//     * getParams Provide a easy way to solve git.exec arguments.
//     * @param {String} cmd  `''` Git command with out 'git' word. 
//     * @private
//     */
//   let getParams = function(cmd) {
//     return {
//         args: cmd,
//         quiet: true,
//         log: false
//     }
// }


class Manager {
    tagRegex = /\d+.\d+.\d+.\d+.\d+/g;
    AssemblyInfoContent = "";

    /**
     * @param {string} AssemblyInformationFilePath 
     * @public
     */
    setAssemblyInformationFilePath(AssemblyInformationFilePath) {
        var oldAssemblyInformationFilePath = this.AssemblyInformationFilePath;
        if (AssemblyInformationFilePath !== oldAssemblyInformationFilePath) {

            this.AssemblyInformationFilePath = AssemblyInformationFilePath;
            //this.updateProperty(AssemblyInformationFilePath, oldAssemblyInformationFilePath);
        }
    }

    /**
     * @returns {string} AssemblyInformationFilePath  
     * @public
     */
    getAssemblyInformationFilePath(AssemblyInformationFilePath) {
        var AssemblyInformationFilePath = this.AssemblyInformationFilePath || `${__dirname}/Properties/AssemblyInfo.cs`;

        return AssemblyInformationFilePath;
    }

    /**
    * getParams Provide a easy way to solve git.exec arguments.
    * @param {String} cmd  `''` Git command with out 'git' word. 
    * @private
    */
    getParams(cmd) {
        return {
            args: cmd,
            quiet: true,
            log: false
        }
    }


    /**
     * parseAssemblyInfo Solve a current version located in  AssemblyInfo.cs file.
     * @param {function} cb  `` Callback function. 
     * @private
     */
    parseAssemblyInfo(cb) {
        fs.readFile(this.getAssemblyInformationFilePath(), { encoding: "utf-8" }, (err, data) => {
            if (err) {
                throw err;
            }
            this.AssemblyInfoContent = data;

            let AssemblyVersionTag = this.AssemblyInfoContent.match(/AssemblyVersion\("\d+.\d+.\d+.\d+"\)/g),
                AssemblyFileVersionTag = this.AssemblyInfoContent.match(/AssemblyFileVersion\("\d+.\d+.\d+.\d+"\)/g);

            let AssemblyVersion = AssemblyVersionTag[0].match(this.tagRegex),
                AssemblyFileVersion = AssemblyFileVersionTag[0].match(this.tagRegex);
            cb(AssemblyVersion);
        });
    }

    /**
      * writeAssemblyInfo Write a current version located in  AssemblyInfo.cs file.
      * @param {String} oldVersion  `''` Old version 
      * @param {String} newVersion  `''` New version 
      * @param {function} cb  `` Callback function. 
      * @private
      */
    writeAssemblyInfo(oldVersion, newVersion, cb) {
        let oldAssemblyVersion = `AssemblyVersion\("${oldVersion}")`,
            oldAssemblyFileVersion = `AssemblyFileVersion\("${oldVersion}")`,
            newAssemblyVersion = `AssemblyVersion\("${newVersion}")`,
            newAssemblyFileVersion = `AssemblyFileVersion\("${newVersion}")`;

        let newAssemblyInfoContent = this.AssemblyInfoContent.replace(oldAssemblyVersion, newAssemblyVersion)
            .replace(oldAssemblyFileVersion, newAssemblyFileVersion);

        fs.writeFile(this.getAssemblyInformationFilePath(), newAssemblyInfoContent, (err) => {
            if (err) {
                throw err;
            }

            cb();
        });
    }

    /**
     * writeAssemblyInfo Write a current version located in  AssemblyInfo.cs file.
     * @param {String} mode  `` Mode as de version change.
     * @param {String} tag  `''` Custom label to apply to the version tag. 
     * @param {function} cb  `` Callback function. 
     * @private
     */
    changeVersion(mode, tag, cb) {
        let me = this;
        me.parseAssemblyInfo((currentVersion) => {
            let newVersion = version.up(currentVersion, mode);
            let tagMode = tag || mode;
            util.log(
                "Change version",
                util.colors.blue(currentVersion),
                " to ",
                util.colors.green(newVersion)
            );
            git.exec(me.getParams('log -n 1 --format="%h"'), (err, stdout) => {
                let checksum = clear(stdout);
                this.writeAssemblyInfo(currentVersion, newVersion, (err) => {
                    if (err) {
                        throw err;
                    }
                    git.exec(me.getParams(`add  ${me.getAssemblyInformationFilePath()}`), (err, stdout, stderr) => {
                        if (err) {
                            throw err;
                        }
                        git.exec(me.getParams(`commit -m "Change version to: v${newVersion} Mode: ${tagMode}" `), (err, stdout, stderr) => {
                            if (err) {
                                throw err;
                            }
                            createTag(checksum, newVersion, tagMode, cb);
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
     * writeAssemblyInfo Write a current version located in  AssemblyInfo.cs file.
     * @param {String} checksum  `` Reference to the last commit in the current repository.
     * @param {String} version  `''` Current version. 
     * @param {String} mode  `` Mode as de version change.
     * @param {function} cb  `` Callback function. 
     * @private
     */
    createTag(checksum, version, mode, cb) {
        let me = this;
        let tag = "v" + version;
        git.exec(me.getParams(`tag -a  ${tag} ${checksum} -m "${mode}"`), (err, stdout, stderr) => {
            git.exec(me.getParams("push --tag"), (err, stdout, stderr) => {
                if (err) {
                    util.log(util.colors.red(err.message));
                    throw err;
                }
                git.exec(me.getParams("push"), (err, stdout, stderr) => {
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

    /**
    * writeAssemblyInfo Write a current version located in  AssemblyInfo.cs file.
    * @param {function} cb  `` Callback function. 
    * @private
    */

    historyTags(n, search, cb) {
        git.exec(this.getParams(`tag --sort=-taggerdate ${search} --format="%(tag), %(taggername), %(taggerdate), %(subject)" | head -n ${n}`), (error, stdout, stderr) => {
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

    init(gulpInstance) {

        /**
         * @todo definir la forma de generacion de etiquetas de version para ramas
         * @todo definir la manera de realizar el merge entre ramas con versiones
         *
         */
        gulpInstance.task("major", cb => {
            this.changeVersion("major", "", cb);
        });

        gulpInstance.task("minor", cb => {
            this.changeVersion("minor", "", cb);
        });

        gulpInstance.task("patch", cb => {
            this.changeVersion("interface", "", cb);
        });

        gulpInstance.task("secure", cb => {
            this.changeVersion("secure", "", cb);
        });

        gulpInstance.task("crud", cb => {
            this.changeVersion("crud", "", cb);
        });
        gulpInstance.task("production", cb => {
            this.changeVersion("interface", "production", cb);
        });
        gulpInstance.task("development", cb => {
            this.changeVersion("interface", "development", cb);
        });

        gulpInstance.task("tags", cb => {
                n = Number.isInteger(argv.n) ? argv.n : 10,
                s = argv.s || argv.search,
                search = s ? `-l "*${s}*"` : "";
                this.historyTags(n, search, cb);
        });
    }
}

module.exports = new Manager();

