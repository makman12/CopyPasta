// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const rp = require('request-promise');
const cheerio = require('cheerio');
const clipboardy = require('clipboardy');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "copypasta" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('copypasta.helloWorld', function () {

		vscode.commands.executeCommand("editor.action.clipboardCutAction").then(e => {
			vscode.env.clipboard.readText().then((text) => {
				let clip = text;
				let query = clip;
				/* code */
				console.log(query)
				query = "python+stackoverflow+" + query.replace(" ", "+")

				let url1 = "https://www.google.com/search?q=" + query
				getGoogle(url1)
			});
		})




		function getGoogle(url1) {
			rp(url1).then(html => {
				let $ = cheerio.load(html)
				let link = $("h3").first().parent().attr("href")
				link = link.split("=")[1].split("&sa")[0]
				scrapeCode(link)
				vscode.window.showInformationMessage('CopyPasta!');

			})
		}


	});

	context.subscriptions.push(disposable);
}

function scrapeCode(link) {
	rp(link)
		.then(function (html) {
			//success!
			let $ = cheerio.load(html)
			let list = []
			$(".accepted-answer").find(".answercell").find("code").each(function (index, element) {
				list.push($(element).text())
			})
			let code = $(".answercell").first().find("code").text()
			code = code.replace(">>> ", "")
			clipboardy.writeSync(code)
			console.log(code)
			vscode.commands.executeCommand("editor.action.clipboardPasteAction")
		})
		.catch(function (err) {
			//handle error
		});
}


// this method is called when your extension is deactivated





function deactivate() {}

module.exports = {
	activate,
	deactivate
}