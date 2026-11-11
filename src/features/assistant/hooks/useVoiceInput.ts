import { useEffect, useRef, useState } from "react";
import { transcribeAudioServerFn } from "@/features/assistant/api/transcription.functions";

type Status = "idle" | "requesting" | "recording" | "transcribing";
const MAX_BYTES = 2 * 1024 * 1024;

export const useVoiceInput = (onTranscript: (text: string) => void) => {
	const [status, setStatus] = useState<Status>("idle");
	const [error, setError] = useState("");
	const recorder = useRef<MediaRecorder | null>(null);
	const stream = useRef<MediaStream | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const operation = useRef(0);
	const busy = useRef(false);
	const callback = useRef(onTranscript);
	useEffect(() => {
		callback.current = onTranscript;
	}, [onTranscript]);

	const release = () => {
		if (timer.current) clearTimeout(timer.current);
		timer.current = null;
		stream.current?.getTracks().forEach((track) => {
			track.stop();
		});
		stream.current = null;
	};

	useEffect(
		() => () => {
			operation.current += 1;
			if (timer.current) clearTimeout(timer.current);
			if (recorder.current?.state === "recording") recorder.current.stop();
			stream.current?.getTracks().forEach((track) => {
				track.stop();
			});
		},
		[],
	);

	const cancel = () => {
		operation.current += 1;
		if (recorder.current?.state === "recording") recorder.current.stop();
		release();
		busy.current = false;
		setStatus("idle");
		setError("");
	};

	const start = async () => {
		if (busy.current) return;
		setError("");
		if (
			!window.isSecureContext ||
			!navigator.mediaDevices?.getUserMedia ||
			typeof MediaRecorder === "undefined"
		) {
			setError(
				"Voice input requires a supported browser and HTTPS (or localhost). You can still type your message.",
			);
			return;
		}
		busy.current = true;
		const current = ++operation.current;
		setStatus("requesting");
		try {
			const media = await navigator.mediaDevices.getUserMedia({ audio: true });
			if (current !== operation.current) {
				media.getTracks().forEach((track) => {
					track.stop();
				});
				return;
			}
			stream.current = media;
			const mimeType = [
				"audio/webm;codecs=opus",
				"audio/mp4",
				"audio/ogg;codecs=opus",
				"audio/webm",
			].find((type) => MediaRecorder.isTypeSupported(type));
			if (!mimeType)
				throw new Error(
					"This browser does not support a compatible recording format. Please type your message.",
				);
			const recording = new MediaRecorder(media, { mimeType });
			recorder.current = recording;
			const chunks: Blob[] = [];
			let size = 0;
			recording.ondataavailable = (event) => {
				if (current !== operation.current) return;
				size += event.data.size;
				if (size > MAX_BYTES) {
					cancel();
					setError("Recording is too large. Please try a shorter message.");
					return;
				}
				if (event.data.size) chunks.push(event.data);
			};
			recording.onerror = () => {
				if (current !== operation.current) return;
				cancel();
				setError("Recording failed. Please try again.");
			};
			recording.onstop = async () => {
				if (current !== operation.current) return;
				release();
				setStatus("transcribing");
				try {
					const blob = new Blob(chunks, { type: recording.mimeType });
					if (!blob.size)
						throw new Error("No audio was recorded. Please try again.");
					const audio = await new Promise<string>((resolve, reject) => {
						const reader = new FileReader();
						reader.onload = () => resolve(String(reader.result).split(",")[1]);
						reader.onerror = () =>
							reject(new Error("Could not read recording."));
						reader.readAsDataURL(blob);
					});
					if (current !== operation.current) return;
					const result = await transcribeAudioServerFn({
						data: {
							audio,
							mimeType: mimeType.split(";")[0] as
								| "audio/webm"
								| "audio/mp4"
								| "audio/ogg",
						},
					});
					if (current === operation.current)
						callback.current(result.transcript);
				} catch (cause) {
					if (current === operation.current)
						setError(
							cause instanceof Error
								? cause.message
								: "Transcription failed. Please try again.",
						);
				} finally {
					if (current === operation.current) {
						busy.current = false;
						setStatus("idle");
					}
				}
			};
			recording.start(1000);
			setStatus("recording");
			timer.current = setTimeout(() => {
				if (recording.state === "recording") recording.stop();
			}, 60_000);
		} catch (cause) {
			if (current !== operation.current) return;
			release();
			busy.current = false;
			setStatus("idle");
			setError(
				cause instanceof DOMException && cause.name === "NotAllowedError"
					? "Microphone access was denied. Allow microphone access in your browser settings or type your message."
					: cause instanceof Error
						? cause.message
						: "Could not access your microphone.",
			);
		}
	};

	const stop = () => {
		if (recorder.current?.state === "recording") recorder.current.stop();
	};
	return { status, error, start, stop, cancel };
};
