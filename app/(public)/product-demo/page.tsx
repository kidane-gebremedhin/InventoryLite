"use client";

import { useEffect, useState } from "react";
import YouTube, { type YouTubeEvent, type YouTubeProps } from "react-youtube";
import { showErrorToast, showSuccessToast } from "@/lib/helpers/Helper";

export default function HomePage() {
	// YouTube component only renders on the client side, This avoids hydration errors.
	const [isClient, setIsClient] = useState<boolean>(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	// Set the video ID for the video.
	const videoId: string = "xR4WM5k4DHA";

	// Optional: Define player options
	const playerOptions: YouTubeProps["opts"] = {
		height: "100%",
		width: "100%",
		playerVars: {
			autoplay: 1, // Autoplay the video
			// mute: 1, // Mute the audio
		},
	};

	const onReady: YouTubeProps["onReady"] = () => {
		// Access the player instance to perform actions like playing the video.
		// event.target.pauseVideo();
		showSuccessToast("Video player is ready.");
	};

	const onError: YouTubeProps["onError"] = () => {
		showErrorToast("Video player error");
	};

	const handleStateChange = (event: YouTubeEvent) => {
		// Check if the video state is "ended".
		if (event.data === 0) {
			event.target.seekTo(0);
			event.target.playVideo();
		}
	};

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4">
			<p className="text-lg text-gray-600 mb-6">
				This demo will walk you through all the features of the application.
			</p>

			<div className="bg-white p-6 rounded-lg shadow-lg">
				{isClient ? (
					<YouTube
						videoId={videoId}
						opts={playerOptions}
						onReady={onReady}
						onError={onError}
						onStateChange={handleStateChange}
					/>
				) : (
					<div className="bg-gray-200 animate-pulse flex items-center justify-center rounded-md">
						<span className="text-gray-500">Loading video player...</span>
					</div>
				)}
			</div>
		</div>
	);
}
