import { ServerResponse } from 'http';
import * as path from 'path';
import * as vscode from 'vscode';
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

// Called when the extension is activated.
export function activate(context: vscode.ExtensionContext) {
	console.log("Agora extension activated");

	// The server is implemented in node.
	let serverModule = context.asAbsolutePath(path.join('lsp-server', 'out', 'server.js'));
	// The debug options for the server:
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can
	// attach to the server for debugging.
	let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	// Options to control the language client.
	let clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents.
		documentSelector: [{ scheme: 'file', language: 'agora' }],
		synchronize: {
			// Notify the server about file changes to .agora files contained
			// in the workspace.
			fileEvents: vscode.workspace.createFileSystemWatcher('**/.agora')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'AgoraLSP',
		'Agora Language Server',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server.
	client.start();

	let disposable = vscode.commands.registerCommand('agora.compile', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from agora!');
	});
	context.subscriptions.push(disposable);
}

// Called when the extension is deactivated.
export function deactivate() {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
