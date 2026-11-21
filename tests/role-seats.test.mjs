import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";
import vm from "node:vm";

// config.ts imports Pi, which is absent in this repo, so load only the function under test.
function loadModelsForRole() {
	const source = readFileSync(new URL("../extensions/pstack/config.ts", import.meta.url), "utf8");
	const start = source.indexOf("export function modelsForRole");
	assert.ok(start > 0, "modelsForRole must be present");
	const body = stripTypeScriptTypes(source.slice(start).replace("export function", "function"));
	return vm.runInNewContext(`${body}; modelsForRole`);
}

test("a parent-model alias keeps its seat in a panel list", () => {
	const modelsForRole = loadModelsForRole();
	const config = { roles: { panel: ["inherit-parent", "x/b", "auto"], alias: "inherit-parent", one: "x/a" } };
	const seats = (role) => Array.from(modelsForRole(config, role));

	assert.deepEqual(seats("panel"), [undefined, "x/b", undefined]);
	assert.deepEqual(seats("alias"), [undefined]);
	assert.deepEqual(seats("one"), ["x/a"]);
	assert.deepEqual(seats("unknown"), []);
	assert.deepEqual(seats(undefined), []);
});
