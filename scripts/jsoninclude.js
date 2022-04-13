/**
 * jsoninclude - JSON Parser that includes JSON from other files.
 */
;(function () {
    'use strict'

    const _ = require('underscore'),
        fs = require('fs'),
        options = require('../config.js')

    JSON.minify = JSON.minify || require('node-json-minify')

    /**
     * Set value for a object property path given as String.
     */
    var setObjectValue = function (obj, value, path) {
        var aPath = path.split('.'),
            parent = obj
        console.log(parent)

        for (var i = 0; i < aPath.length - 1; i++) {
            if (!parent.hasOwnProperty(aPath[i])) {
                console.warn("Can't set object value. Wrong path: " + path)
                return
            }

            parent = parent[aPath[i]]
        }

        parent[aPath[aPath.length - 1]] = value
    }

    /**
     * Get value for a object property path given as String.
     */
    var getObjectValue = function (obj, path) {
        var aPath = path.split('.'),
            parent = obj

        for (var i = 0; i < aPath.length; i++) {
            if (!parent.hasOwnProperty(aPath[i])) {
                console.warn("Can't get object value. Wrong path: " + path)
                return {}
            }

            parent = parent[aPath[i]]
        }
        console.log(parent)

        return parent
    }

    const loadInclude = function (includePath) {
        try {
            return fs.readFileSync(`${options.paths.assets.json}/${includePath}`, 'UTF-8')
        } catch (error) {
            console.error(`Can\'t read file: ${options.paths.assets.json}/${includePath}`)
            return JSON.stringify({})
        }
    }

    /**
     * JSON.parse reviver function to execute jsoninclude features.
     */
    var executeJSONInclude = function (k, v) {
        if (v['@->jsoninclude'] !== undefined && v['@->jsoninclude'] !== '') {
            try {
                //read include

                let includedStringifiedJson = loadInclude(v['@->jsoninclude'])
                //parse as JSON
                let includeJSON = parse(includedStringifiedJson)
                console.log(includeJSON)
                //get specified content
                if (v['@->contentpath'] !== undefined) {
                    includeJSON = getObjectValue(includeJSON, v['@->contentpath'])
                }

                if (v['@->extends'] !== undefined) {
                    includeJSON = _.extend(includeJSON, v['@->extends'])
                }

                //override values
                if (v['@->overrides'] !== undefined) {
                    for (var i = 0; i < v['@->overrides'].length; i++) {
                        if (
                            v['@->overrides'][i]['@->contentpath'] !== undefined &&
                            v['@->overrides'][i]['@->value'] !== undefined
                        ) {
                            setObjectValue(
                                includeJSON,
                                v['@->overrides'][i]['@->value'],
                                v['@->overrides'][i]['@->contentpath']
                            )
                        }
                    }
                }
                console.log(includeJSON)
                return includeJSON
            } catch (e) {
                console.error(
                    "Can't parse JSONInclude! " + type(e) === '[object Object]'
                        ? JSON.stringify(e, null, 4)
                        : e
                )
                throw {
                    orig: e,
                    message: e.message,
                    json: v,
                    via: k,
                }
            }
        }

        //nothing to do
        console.log(v)
        return v
    }

    /**
     * Parse a string as JSON and transforming the value produced by parsing.
     */
    var parse = function (text) {
        try {
            let result = JSON.parse(JSON.minify(text), executeJSONInclude)
            console.log(result)
            return result
        } catch (e) {
            console.error(`Can't parse json! ${e}`)
            throw {
                orig: e,
                message: e.message,
                json: text,
                via: 'Bla',
            }
        }
    }

    module.exports = {
        /**
         * Create jsoninclude Object to parse JSON.
         *
         * @param reader Callback to read include file.
         * @returns jsoninclude Object.
         */
        parse: parse,
    }
})()
