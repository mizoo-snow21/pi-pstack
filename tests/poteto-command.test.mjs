import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const SOURCE = new URL("../extensions/pstack/index.ts", import.meta.url);

function potetoCommandBlock() {
	const source = readFileSync(SOURCE, "utf8");
	const start = source.indexOf('pi.registerCommand("poteto-mode"');
	const end = source.indexOf('pi.registerCommand("setup-pstack"', start);
	assert.ok(start > 0 && end > start, "poteto-mode command block must be present");
	return source.slice(start, end).trimEnd();
}

function load() {
	const calls = { sent: [], entries: [], status: [], notify: [] };
	const pi = {
		registerCommand: (name, command) => {
			calls.registered = name;
			calls.command = command;
		},
		appendEntry: (customType, data) => calls.entries.push(structuredClone({ customType, data })),
		sendUserMessage: (...args) => calls.sent.push(structuredClone(args)),
	};
	const script = `let potetoMode = false;\nconst MODE_ENTRY = "pstack-mode";\n${potetoCommandBlock()}`;
	vm.runInNewContext(script, { pi });
	return { calls, handler: calls.command.handler };
}

function makeCtx(calls) {
	return {
		ui: {
			setStatus: (key, value) => calls.status.push(structuredClone({ key, value })),
			notify: (message, level) => calls.notify.push({ message, level }),
		},
	};
}

test("bare /poteto-mode sends the skill command as a follow-up user message", async () => {
	const { calls, handler } = load();
	const ctx = makeCtx(calls);
	assert.equal(ctx.sendUserMessage, undefined, "regression: ctx must not be the API surface");

	await handler("", ctx);

	assert.deepEqual(calls.sent, [["/skill:poteto-mode", { deliverAs: "followUp", expandPromptTemplates: true }]]);
	assert.deepEqual(calls.entries, [{ customType: "pstack-mode", data: { enabled: true } }]);
	assert.deepEqual(calls.status, [{ key: "pstack-mode", value: "pstack: poteto mode" }]);
});

test("a task argument is trimmed and appended to the skill command", async () => {
	const { calls, handler } = load();

	await handler("  fix the parser  ", makeCtx(calls));

	assert.equal(calls.sent.length, 1);
	assert.equal(calls.sent[0][0], "/skill:poteto-mode fix the parser");
	assert.deepEqual(calls.sent[0][1], { deliverAs: "followUp", expandPromptTemplates: true });
});

test("off disables the mode without sending a message", async () => {
	const { calls, handler } = load();

	await handler(" OFF ", makeCtx(calls));

	assert.deepEqual(calls.sent, []);
	assert.deepEqual(calls.entries, [{ customType: "pstack-mode", data: { enabled: false } }]);
	assert.deepEqual(calls.status, [{ key: "pstack-mode", value: undefined }]);
	assert.equal(calls.notify.length, 1);
});
