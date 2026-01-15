/** biome-ignore-all lint/a11y/useMediaCaption: false */
"use client";

export default function VideoPage() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4">
			<p className="text-lg text-gray-600 mb-6">
				This demo will walk you through all the features of the application.
			</p>

			<div className="bg-white p-6 rounded-lg shadow-lg">
				<div className="video-container">
					<video width="600" height="400" controls preload="none">
						<source src="/product_demos/demo-1.mp4" type="video/mp4" />
						Your browser does not support the video.
					</video>
				</div>
			</div>
		</div>
	);
}
