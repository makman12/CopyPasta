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


function isInt(value) {
	return !isNaN(value) &&
		parseInt(Number(value)) == value &&
		!isNaN(parseInt(value, 10));
}

let link;
let links;
let list;

function activate(context) {

	let query;

	let disposable = vscode.commands.registerCommand('copypasta.copypasta', function () {
		let language = vscode.window.activeTextEditor.document.languageId
		let count = 1;
		let activeLine = vscode.window.activeTextEditor.selection.active.line;
		vscode.window.activeTextEditor.selection.active.line = activeLine + 1
		vscode.commands.executeCommand("editor.action.clipboardCutAction").then(() => {

			vscode.env.clipboard.readText().then((text) => {
				console.log("bu text", text)
				let clip = text.trim();
				console.log(clip, clip == "-s")
				if (clip == "-s") {
					vscode.env.openExternal(vscode.Uri.parse(link));

				} else if (clip == "-l") {
					getQuickList()
				} else if (isInt(clip)) {

					let url1 = "https://www.google.com/search?q=" + query
					getGoogle(url1, false, clip)
				} else {


					query = clip;
					let open;
					if (query.substr(-2) == "-s") {
						open = true
						query = query.split("-s")[0]
					} else {
						open = false
					}
					if (query.substr(-3).includes("-g")) {

						count = query.substr(-1)
						console.log(count)
						query = query.split("-g")[0]
					}
					query = language + "+stackoverflow+" + query.replaceAll(" ", "+")
					let url1 = "https://www.google.com/search?q=" + query
					getGoogle(url1, open, count)
				}
			});
		})

	});

	context.subscriptions.push(disposable);
}

function getGoogle(url1, open, count) {
	rp(url1).then(html => {
		let $ = cheerio.load(html)
		links = []
		$("h3").each((i, e) => {
			let l = e.parent.attribs.href
			l = l.split("=")[1].split("&sa")[0]
			if (l.includes("stackoverflow.com")) {
				links.push(l)
			}

		})
		link = links[0]
		scrapeCode(link, open, count)


	})
}

function scrapeCode(link, open, count = 1) {
	if (count != 1) {
		let code = list[count - 1]
		if (code) {
			code = "\n" + list[count - 1]
			clipboardy.writeSync(code)
			vscode.commands.executeCommand("editor.action.clipboardPasteAction")
			vscode.window.showInformationMessage("CopyPasta is Ready!");

		} else {
			vscode.window.showInformationMessage("CopyPasta is not healthy for you!, I just couldn't find it :(");
		}

	} else {


		rp(link)
			.then(function (html) {
				//success!
				let $ = cheerio.load(html)
				list = []
				$(".answercell").find("pre > code").each(function (index, element) {
					list.push($(element).text().replace(">>> ", ""))
				})
				if (list.length > 1) {
					vscode.window.showQuickPick(list).then(seçim => {
						console.log(seçim)
						clipboardy.writeSync(seçim)
						vscode.commands.executeCommand("editor.action.clipboardPasteAction")
					})

				} else if (list.length == 1) {
					clipboardy.writeSync(list[0])
					vscode.commands.executeCommand("editor.action.clipboardPasteAction")
				} else {
					vscode.window.showInformationMessage("CopyPasta is not healthy for you!, I just couldn't find it :(");
				}
			})
			.catch(function () {
				//handle error
			});
	}
}


function getQuickList() {
	vscode.window.showQuickPick(list).then(seçim => {
		console.log(seçim)
		clipboardy.writeSync(seçim)
		vscode.commands.executeCommand("editor.action.clipboardPasteAction")
	})
}


// this method is called when your extension is deactivated


function deactivate() {}

module.exports = {
	activate,
	deactivate
}