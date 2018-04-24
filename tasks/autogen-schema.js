const childProcess = require('child_process');

module.exports = function (grunt) {
    "use strict";

    const fs = require('fs');
    const path = require('path');
    const rimraf = require('rimraf');

    function runPHPCSFixer(destination) {
        const shouldRun = grunt.config('autogen-schema.options.runPHPCSFixer');

        if (shouldRun) {
            childProcess.exec("php " + path.join(__dirname, "..", "bin", "php-cs-fixer") + " fix " + destination, function (err, stdout, stderr) {
                if (err) {
                    grunt.log.error(err);

                    if (stderr) {
                        grunt.log.error(stderr);
                    }
                }

                if (stdout) {
                    grunt.log.writeln("PHPCSFixer ran on generated Schema & fixes applied.");
                }
            });
        }
    }

    function generateSchema() {
        const source = grunt.config('autogen-schema.options.source');
        const destination = grunt.config('autogen-schema.options.destination');
        const generatorCmdPath = grunt.config('autogen-schema.options.generatorCmdPath');
        const namespace = grunt.config('autogen-schema.options.namespace') ? grunt.config('autogen-schema.options.namespace') : "";

        if (source === undefined) {
            grunt.log.error("Source must be defined in options.source.");
            return;
        }

        if (destination === undefined) {
            grunt.log.error("Destination must be defined in options.destination.");
            return;
        }

        if (generatorCmdPath === undefined) {
            grunt.log.error("generatorCmdPath (location of the generator) must be defined in options.destination.");
            return;
        }

        // Remove files under target directory (can be very dangerous if set incorrectly)
        if (grunt.config('autogen-schema.options.deleteAndRecreate') === true) {
            rimraf.sync(path.join(destination));
        }

        // Generate schema
        grunt.log.writeln("Generating GraphQL Schema classes...");
        childProcess.exec("php " + generatorCmdPath + " generate-classes --mode types --namespaced-target-namespace \"" + namespace + "\" " + source + " " + destination, function (err, stdout, stderr) {
            if (err) {
                grunt.log.error(err);
            }

            if (stdout) {
                grunt.log.writeln("Generated classes successfully.");
            }

            if (stderr) {
                grunt.log.error(stderr);
            }

            if (!err) {
                runPHPCSFixer(destination);
            }
        });
    }

    grunt.registerTask("autogen-schema", 'Auto-generates a GraphQL Schema', function () {
        // Is PHP installed?
        this.async();
        childProcess.exec("php -v", function (err, stdout, stderr) {
            if (err) {
                grunt.log.error("PHP is not installed.");
            } else {
                generateSchema();
            }
        })
    });
};