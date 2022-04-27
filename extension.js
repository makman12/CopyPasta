// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const rp = require("request-promise");
const cheerio = require("cheerio");
const clipboardy = require("clipboardy");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */

function isInt(value) {
    return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
}

let link;
let links;
let list;

function activate(context) {
    let query;

    let disposable = vscode.commands.registerCommand("copypasta.copypasta", function () {
        // Get language
        let language = vscode.window.activeTextEditor.document.languageId;
        // Set count to 1 be default
        let count = 1;
        // Get active line and the one following it
        let activeLine = vscode.window.activeTextEditor.selection.active.line;
        vscode.window.activeTextEditor.selection.active.line = activeLine + 1;
        // Remove current line and then do stuff with it
        vscode.commands.executeCommand("editor.action.clipboardCutAction").then(() => {
            vscode.env.clipboard.readText().then((text) => {
                // Remove weird spacing in front and the back of the text
                let clip = text.trim();

                // Open webbrowser with result from prev query
                if (clip == "-s") {
                    vscode.env.openExternal(vscode.Uri.parse(link));
                }

                // Open list with result from prev query
                else if (clip == "-l") {
                    getQuickList();
                }

                // If it's an int, get that comment (from prev query)
                else if (isInt(clip)) {
                    let url1 = "https://www.google.com/search?q=" + query;
                    getGoogle(url1, false, clip);
                }

                // New query
                else {
                    query = clip;

                    // False by default
                    let open = false;
                    let useList = false;

                    // If the query ends with -s, set open to true and remove the -s
                    if (query.substr(-2) == "-s") {
                        open = true;
                        query = query.split("-s")[0];
                    }

                    // If the query ends with -s, set open to true and remove the -s
                    if (query.substr(-2) == "-l") {
                        useList = true;
                        query = query.split("-l")[0];
                    }

                    // No idea what -g does, but it is something with an count (i assume an int?)
                    // Multiple results?
                    if (query.substr(-4).includes("-g") || query.substr(-5).includes("-g") || query.substr(-6).includes("-g")) {
                        // Negative four, because there will likely be a space between the -g and the int the user enters. Also check for negative five and six, for double and tripple digits

                        count = query.split("-g")[1].trim();
                        console.log(count);

                        // Remove everything after -g from query
                        query = query.split("-g")[0];
                    }

                    // Create query for Google
                    query = language + "+stackoverflow+" + query.replaceAll(" ", "+");

                    // Create URI
                    let url1 = "https://www.google.com/search?q=" + query;

                    // Get Google results
                    getGoogle(url1, open, count, useList);
                }
            });
        });
    });

    context.subscriptions.push(disposable);
}

function getGoogle(url1, open, count, useList) {
    // Get all results (h3) where the URI includes
    // stackoverflow.com and pus it to an array.
    // Scrape the code from the first result.
    rp(url1).then((html) => {
        let $ = cheerio.load(html);
        links = [];
        $("h3").each((i, e) => {
            let l = e.parent.attribs.href;
            l = l.split("=")[1].split("&sa")[0];
            if (l.includes("stackoverflow.com")) {
                links.push(l);
            }
        });
        link = links[0];
        scrapeCode(link, open, count, useList);
    });
}

// Get code from Stackoverflow results based on these
// parameters: open, count and useList
function scrapeCode(link, open, count, useList) {
    rp(link)
        .then(function (html) {
            // Generate list
            let $ = cheerio.load(html);
            list = [];
            $(".answercell")
                .find("pre > code")
                .each(function (index, element) {
                    list.push($(element).text().replace(">>> ", ""));
                });

            // Get specific result if count is not 1
            if (count != 1) {
                let code = list[count - 1];
                if (code) {
                    code = "\n" + list[count - 1];
                    clipboardy.writeSync(code);
                    vscode.commands.executeCommand("editor.action.clipboardPasteAction");
                    vscode.window.showInformationMessage("CopyPasta is Ready!");
                } else {
                    vscode.window.showInformationMessage("CopyPasta is not healthy for you!, I just couldn't find it :(");
                }
            }

            // Open webbrowser if open is true
            else if (open === true) {
                vscode.env.openExternal(vscode.Uri.parse(link));
            } else {
                // If the user requests a list and the list of
                // results in longer then 1
                if (useList === true && list.length > 1) {
                    vscode.window.showQuickPick(list).then((seçim) => {
                        console.log(seçim);
                        clipboardy.writeSync(seçim);
                        vscode.commands.executeCommand("editor.action.clipboardPasteAction");
                    });
                }
                // If there is more then zero results, get the
                // first one and paste that in
                else if (list.length > 0) {
                    clipboardy.writeSync(list[0]);
                    vscode.commands.executeCommand("editor.action.clipboardPasteAction");
                }

                // Show error message
                else {
                    vscode.window.showInformationMessage("CopyPasta is not healthy for you!, I just couldn't find it :(");
                }
            }
        })
        .catch(function () {
            vscode.window.showInformationMessage("Something went wrong while CopyPasta tried to get results :(");
            // handle error
        });
}

function getQuickList() {
    vscode.window.showQuickPick(list).then((seçim) => {
        console.log(seçim);
        clipboardy.writeSync(seçim);
        vscode.commands.executeCommand("editor.action.clipboardPasteAction");
    });
}

// this method is called when your extension is deactivated

function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
