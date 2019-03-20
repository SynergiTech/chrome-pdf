#!/usr/bin/env node
const puppeteer = require('puppeteer');
const allowedFormats = [
    'Letter',
    'Legal',
    'Tabloid',
    'Ledger',
    'A0',
    'A1',
    'A2',
    'A3',
    'A4',
    'A5',
    'A6',
];
const resolve = require('path').resolve;
const readFileSync = require('fs').readFileSync;

var args = require('yargs')
    .usage('$0 <command> [args]')
    .option('waitUntil', {
        default: 'networkidle2',
        requiresArg: true,
        describe: 'The event to wait for before rendering'
    })
    .option('emulateMedia', {
        default: 'print',
        requiresArg: true,
        describe: 'The media type to emulate'
    })
    .option('sandbox', {
        default: true,
        describe: 'Enable the sandbox',
        boolean: true,
    })
    .option('content', {
        describe: 'HTML content to render',
        conflicts: ['page'],
        requiresArg: true,
    })
    .option('page', {
        describe: 'The page to render',
        conflicts: ['content', 'file'],
        requiresArg: true,
    })
    .option('file', {
        describe: 'The file to render',
        conflicts: ['content', 'page'],
        requiresArg: true,
    })
    .option('path', {
        describe: 'Location to store the rendered output - sends to STDOUT if not specified',
        requiresArg: true,
    })
    .option('viewport', {
        describe: 'Specify viewport options, e.g., width=1920,height=1080,isMobile=true',
        requiresArg: true,
        coerce: (arg) => {
            var opts = arg.split(',');
            var viewport = {};

            for (var i in opts) {
                var line = opts[i];
                var setting = line.split('=');
                if (setting.length != 2) {
                    throw 'Incorrect parameter format for `viewport`';
                }
                var key = setting[0];
                var val = setting[1];
                if (key == 'width') {
                    viewport.width = parseInt(val);
                }
                if (key == 'height') {
                    viewport.height = parseInt(val);
                }
                if (key == 'deviceScaleFactor') {
                    viewport.deviceScaleFactor = parseFloat(val);
                }
                if (key == 'isMobile') {
                    viewport.isMobile = val == 'true';
                }
                if (key == 'hasTouch') {
                    viewport.hasTouch = val == 'true';
                }
                if (key == 'isLandscape') {
                    viewport.isLandscape = val == 'true';
                }
            }

            return viewport;
        },
    })
    .option('debug', {
        default: false,
        describe: 'Run Chrome with a head and keep the browser open after render',
        boolean: true,
    })
    .command('pdf', 'Output content rendered as PDF', function (args) {
        return args
            .option('landscape', {
                default: false,
                describe: 'Page orientation',
                boolean: true,
            })
            .option('scale', {
                default: 1,
                describe: 'Scale of the webpage rendering',
                requiresArg: true,
            })
            .option('displayHeaderFooter', {
                default: false,
                describe: 'Display header and footer',
                boolean: true,
            })
            .option('headerTemplate', {
                describe: 'HTML template for the print header',
                requiresArg: true,
                coerce: (val) => {
                    try {
                        return readFileSync(val).toString();
                    } catch (err) {
                        return val;
                    }
                }
            })
            .option('footerTemplate ', {
                describe: 'HTML template for the print footer',
                requiresArg: true,
                coerce: (val) => {
                    try {
                        return readFileSync(val).toString();
                    } catch (err) {
                        return val;
                    }
                }
            })
            .option('printBackground', {
                describe: 'Print background graphics',
                boolean: true,
                default: false,
            })
            .option('pageRanges', {
                describe: 'Paper ranges to print, e.g., \'1-5, 8, 11-13\'',
                default: '',
                requiresArg: true,
                type: 'string',
            })
            .option('format', {
                describe: 'Paper format. If set, takes priority over width or height options',
                default: 'Letter',
                requiresArg: true,
            })
            .option('width', {
                describe: 'Paper width, accepts values labeled with units',
                requiresArg: true,
            })
            .option('height', {
                describe: 'Paper height, accepts values labeled with units',
                requiresArg: true,
            })
            .option('margin', {
                describe: 'Paper margins, defaults to none, top,right,bottom,left e.g., 20px,20px,20px,20px',
                requiresArg: true,
                coerce: (arg) => {
                    var split = arg.split(',');
                    if (split.length != 4) {
                        throw 'Wrong number of margins specified';
                    }

                    return {
                        top: split[0],
                        right: split[1],
                        bottom: split[2],
                        left: split[3]
                    };
                }
            })
            .option('preferCSSPageSize', {
                describe: 'Give any CSS @page size declared in the page priority over what is declared in width and height or format options',
                boolean: true,
                default: false
            });
    })
    .command('screenshot', 'Output content rendered as an image', function (args) {
        return args
            .option('type', {
                default: 'png',
                describe: 'Specify screenshot type',
                choices: ['jpeg', 'png'],
            })
            .option('quality', {
                describe: 'The quality of the image, between 0-100. Not applicable to png images',
                requiresArg: true,
            })
            .option('fullPage', {
                describe: 'When set, takes a screenshot of the full scrollable page',
                boolean: true,
                default: false,
            })
            .option('clip', {
                describe: 'Specify clipping region of the page, e.g., x,y,width,height',
                requiresArg: true,
                coerce: (arg) => {
                    var split = arg.split(',');
                    if (split.length != 4) {
                        throw 'Wrong number of clipping region args specified';
                    }

                    return {
                        x: split[0],
                        y: split[1],
                        width: split[2],
                        height: split[3]
                    };
                }
            })
            .option('omitBackground', {
                describe: 'Hides default white background and allows capturing screenshots with transparency',
                boolean: true,
                default: false,
            })
            .option('encoding', {
                describe: 'The encoding of the image',
                choices: ['base64', 'binary'],
                default: 'binary',
                requiresArg: true,
            });
    })
    .demandCommand(1, 1)
    .check(function(argv, opts) {
        var cmd = argv._[0];
        if (cmd != 'pdf' && cmd != 'screenshot') {
            throw 'Unknown command: ' + cmd;
        }

        if (argv.scale < 0.1 || argv.scale > 2) {
            throw 'Scale is out of range: must be between 0.1 - 2';
        }

        if (argv.format && allowedFormats.indexOf(argv.format) === -1) {
            throw 'Format value "'+argv.format+'" is not allowed';
        }

        if (argv.quality && (argv.quality < 0 || argv.quality > 100)) {
            throw 'Quality is out of range: must be between 0 - 100';
        }

        return true;
    })
    .help()
    .argv;

const cmd = args._[0];
var debug = false;
if (args.debug) {
    if (cmd != 'pdf') {
        debug = true;
    } else {
        console.warn('Debug mode incompatible with PDF rendering');
    }
}

var generatePDFConfig = (args) => {
    var config = {
        scale: args.scale || 1,
        displayHeaderFooter: args.displayHeaderFooter || false,
        printBackground: args.printBackground || false,
        landscape: args.landscape || false,
        pageRanges: args.pageRanges || '',
        format: args.format || 'Letter',
        preferCSSPageSize: args.preferCSSPageSize || false,
    };

    if (args.path) {
        config.path = args.path;
    }
    if (args.headerTemplate) {
        config.headerTemplate = args.headerTemplate;
    }
    if (args.footerTemplate) {
        config.footerTemplate = args.footerTemplate;
    }
    if (args.width) {
        config.width = args.width;
    }
    if (args.height) {
        config.height = args.height;
    }
    if (args.margin) {
        config.margin = args.margin;
    }

    return config;
};

var generateScreenshotConfig = (args) => {
    var config = {
        type: args.type || 'png',
        fullPage: args.fullPage || false,
        omitBackground: args.omitBackground || false,
        encoding: args.encoding || 'binary',
    };

    if (args.path) {
        config.path = args.path;
    }
    if (args.quality) {
        config.quality = args.quality;
    }
    if (args.clip) {
        config.clip = args.clip;
    }

    return config;
};

(async () => {
    try {
        var browserArgs = [];
        if (!args.sandbox) {
            browserArgs.push('--no-sandbox');
        }

        const browser = await puppeteer.launch({
            headless: !debug,
            args: browserArgs
        });
        const page = await browser.newPage();

        if (args.viewport) {
            await page.setViewport(args.viewport);
        }

        var location = null;
        if (args.page) {
            location = args.page;
        } else if (args.content) {
            location = 'data:text/html;base64,' + Buffer.from(args.content).toString('base64');
        } else if (args.file) {
            location = 'file:///' + resolve(args.file);
        } else {
            var input = await (async function() {
                var prom = new Promise((resolve) => {
                    var input = '';

                    process.stdin.setEncoding('utf8');
                    process.stdin.on('readable', async () => {
                        const chunk = process.stdin.read();
                        if (chunk !== null) {
                            input += chunk;
                        }
                    });

                    process.stdin.on('end', () => {
                        resolve(input);
                    });
                });

                return prom;
            })();
            location = 'data:text/html;base64,' + Buffer.from(input).toString('base64');
        }

        await page.goto(location, {
            waitUntil: args.waitUntil
        });
        page.emulateMedia(args.emulateMedia);

        var output = false;
        if (cmd == 'pdf') {
            output = await page.pdf(generatePDFConfig(args));
        }
        if (cmd == 'screenshot') {
            output = await page.screenshot(generateScreenshotConfig(args));
        }
        if (output === false) {
            console.error('Unable to generate output');
            process.exit(1);
        }

        if (args.path) {
            if (process.stdout.isTTY) {
                console.log('Output saved to ' + args.path);
            }
        } else {
            if (process.stdout.isTTY) {
                console.log(output);
            } else {
                process.stdout.write(output);
            }
        }

        if (!debug) {
            await browser.close();
        }
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
