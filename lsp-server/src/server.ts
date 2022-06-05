import {
	createConnection,
	TextDocuments,
	DiagnosticSeverity,
	ProposedFeatures,
	Range,
	InitializeParams,
	DidSaveTextDocumentNotification,
	DidSaveTextDocumentParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	ProtocolNotificationType,
	Diagnostic,
	PublishDiagnosticsParams,
	PublishDiagnosticsNotification,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult
} from 'vscode-languageserver/node';
import { spawnSync } from 'child_process';

import { TextDocument } from 'vscode-languageserver-textdocument';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

connection.console.log('Agora LSP server is running!');

// Create a simple text document manager.
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
	let capabilities = params.capabilities;

	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
		}
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}
	return result;
});

connection.onInitialized(() => {
	connection.client.register(DidSaveTextDocumentNotification.type, undefined);
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
});

documents.onDidChangeContent(async change => {
	let path = change.document.uri.replace('file://', '');
	let result = spawnSync('agora', ['--cost', path]);

	let lines = result.stderr.toString().split(/\r\n|\r|\n/);
	if (lines[0].includes('Failed to parse cost model')) {
		var errorsAt = new Set<[number, number]>();
		lines.forEach(line => {
			let match = line.match('line: ([0-9]+), column: ([0-9]+)');
			if (match && match.length > 0) {
				let line = parseInt(match[1]);
				let column = parseInt(match[2]);
				errorsAt.add([line, column]);
			}
		});

		errorsAt.forEach(location => {
			let endOfError = lines[location[0]].indexOf(' ', location[1]);
			if (endOfError < 0) {
				endOfError = lines[location[0]].length;
			}

			connection.sendDiagnostics({
				uri: path, diagnostics: [{
					range: { start: { line: location[0], character: location[1] }, end: { line: location[0], character: endOfError } },
					message: "Unexpected token",
				}]
			});
		});
	} else {
		// Compilation was successful.
	}
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
