import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const transcribeAudioServerFn = createServerFn({ method: "POST" })
	.validator(
		z.object({
			audio: z
				.string()
				.min(1)
				.max(2_800_000)
				.regex(/^[A-Za-z0-9+/]+={0,2}$/),
			mimeType: z.enum(["audio/webm", "audio/mp4", "audio/ogg", "audio/wav"]),
		}),
	)
	.handler(async ({ data }) => {
		const { transcribeAudio } = await import(
			"../services/transcription.server"
		);
		return transcribeAudio(data);
	});
