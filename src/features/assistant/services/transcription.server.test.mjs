import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { transcribeAudio } from "./transcription.server.ts";

const originalFetch = globalThis.fetch;
const originalGoogleKey = process.env.GOOGLE_API_KEY;
const originalGeminiKey = process.env.GEMINI_API_KEY;
beforeEach(() => {
	process.env.GOOGLE_API_KEY = "test-only-key";
	delete process.env.GEMINI_API_KEY;
});
afterEach(() => {
	globalThis.fetch = originalFetch;
	if (originalGoogleKey === undefined) delete process.env.GOOGLE_API_KEY;
	else process.env.GOOGLE_API_KEY = originalGoogleKey;
	if (originalGeminiKey === undefined) delete process.env.GEMINI_API_KEY;
	else process.env.GEMINI_API_KEY = originalGeminiKey;
});

for (const transcript of [
	"Recommend a comedy",
	"Recomiéndame una película de comedia",
]) {
	test(`preserves transcript language: ${transcript}`, async () => {
		globalThis.fetch = async (_url, options) => {
			assert.equal(options.headers["x-goog-api-key"], "test-only-key");
			const body = JSON.parse(options.body);
			assert.deepEqual(body.contents[0].parts[0].inlineData, {
				mimeType: "audio/mp4",
				data: "YXVkaW8=",
			});
			return Response.json({
				candidates: [
					{ content: { parts: [{ text: JSON.stringify({ transcript }) }] } },
				],
			});
		};
		assert.deepEqual(
			await transcribeAudio({ audio: "YXVkaW8=", mimeType: "audio/mp4" }),
			{ transcript },
		);
	});
}

test("rejects silence instead of inserting an empty message", async () => {
	globalThis.fetch = async () =>
		Response.json({
			candidates: [{ content: { parts: [{ text: '{"transcript":"  "}' }] } }],
		});
	await assert.rejects(
		transcribeAudio({ audio: "YQ==", mimeType: "audio/webm" }),
		/No speech/,
	);
});

test("does not expose provider errors to the client", async () => {
	globalThis.fetch = async () =>
		new Response("private provider error", { status: 429 });
	await assert.rejects(
		transcribeAudio({ audio: "YQ==", mimeType: "audio/webm" }),
		/Voice transcription failed/,
	);
});

test("missing configuration never makes a provider request", async () => {
	delete process.env.GOOGLE_API_KEY;
	globalThis.fetch = () => {
		throw new Error("Unexpected provider request");
	};
	await assert.rejects(
		transcribeAudio({ audio: "YQ==", mimeType: "audio/mp4" }),
		/not configured/,
	);
});
