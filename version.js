/*!
 * @author myax <mig_dj@hotmail.com>
 * date 10/26/2018
 * implement pa-dss version tag
 */
class Version {
  constructor() {
    this._tagRegex = /\d+.\d+.\d+.\d+/;
    this._major = 0;
    this._minor = 0;
    this._build = 0;
    this._revision = 0;
  }
  /**
   * @param {String} tag  `''` tag version to parse
   * @private
   */
  parse(tag) {
    if (typeof tag == "string" && this._tagRegex.test(tag.trim())) {
      let tagElements = tag.split(".");
      this._major = parseInt(tagElements[0]);
      this._minor = parseInt(tagElements[1]);
      this._build = parseInt(tagElements[2]);
      this._revision = parseInt(tagElements[3]);
    } else {
      throw this.error("Invalid tag pattern", 1);
    }
  }
  /**
   * @param {String} message  `Error` Error message
   * @param {Number} code  `0` Error code
   * @private
   */
  error(message = "Error", code = 0) {
    return {
      message: message,
      code: code
    };
  }

  /**
   * increase tag version
   * @param {Number} tag  `` tag version
   * @param {String} mode  `` change mode
   * @public
   */
  up(tag, mode) {
    return this.change(tag, mode, true);
  }
  /**
   * decrease tag version
   * @param {Number} tag  `` tag version
   * @param {String} mode  `` change mode
   * @public
   */
  down(tag, mode) {
    return this.change(tag, mode, false);
  }
  /**
   * decrease tag version
   * @param {Number} tag  `` tag version
   * @param {String} mode  `` change mode ['major', 'minor', 'build', 'revision']
   * @param {Boolean} inc  `false` increase or decrease tag version
   * @private
   */
  change(tag, mode, inc) {
    this.parse(tag);
    var add = inc ? 1 : -1;
    switch (mode) {
      case "major":
        {
          this._major += add;
          this._minor = 0;
          this._build = 0;
          this._revision = 0;
        }
        break;
      case "minor":
        {
          this._minor += add;
          this._build = 0;
          this._revision = 0;
        }
        break;
      case "build":
        {
          this._build += add;
          this._revision = 0;
        }
        break;
      case "revision":
        {
          this._revision += add;
        }
        break;
      default:
        break;
    }
    return [
      this._major,
      this._minor,
      this._build,
      this._revision
    ].join(".");
  }
}

module.exports = new Version();
