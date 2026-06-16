import { AltArrowUp, Calendar, Devices, Download, Graph, Lock, Shield } from "@solar-icons/react";
import { useState } from "react";

const features = [
	{
		name: "Secure Sign in",
		Icon: () => <Lock className="ml-[-6px] mr-2 mt-px h-5 w-5" />,
		description: "Use your email to securely log in to the application; no password is required.",
		screenshotUrl: "/demo/signin.jpg",
		demoUrl: "/demo/signin.mp4",
	},
	{
		name: "Privacy",
		description: "Your private data, such as name, price, and notes, etc., is securely encrypted in the database.",
		Icon: () => <Shield className="ml-[-6px] mr-2 -mt-px h-5 w-5" />,
		screenshotUrl: "/demo/expenses.jpg",
	},
	{
		name: "Reports",
		description: "You can understand your spending habits by viewing detailed reports on the overview page.",
		Icon: () => <Graph className="ml-[-6px] mr-2 mt-px h-5 w-5" />,
		screenshotUrl: "/demo/overview.jpg",
	},
	{
		name: "Recurring Subscriptions",
		description: "Easily track subscriptions; no need to remember renewal dates or maintain a messy spreadsheet.",
		Icon: () => <Calendar className="ml-[-6px] mr-2 mt-px h-5 w-5" />,
		screenshotUrl: "/demo/subscriptions.jpg",
		demoUrl: "/demo/subscriptions.mp4",
	},

	{
		name: "Multi-device & Cross-platform",
		description:
			"Access from multiple devices, including smartphones and laptops, makes it easy to track expenses on-the-go from any device.",
		Icon: () => <Devices className="ml-[-6px] mr-2 mt-px h-5 w-5" />,
		screenshotUrl: "/demo/responsive.jpg",
	},
	{
		name: "Export Data",
		description: "Export your data in the CSV file format, which is widely supported.",
		Icon: () => <Download className="ml-[-6px] mr-2 mt-px h-5 w-5" />,
		screenshotUrl: "/demo/export.jpg",
		demoUrl: "/demo/export.mp4",
	},
];

export default function Features() {
	const [selected, setSelected] = useState(0);
	return (
		<>
			<div className="mx-auto block h-fit max-w-sm rounded-2xl  border bg-white p-2 sm:w-96 lg:ml-[-50px]">
				{features.map((feature, index) => {
					const isSelected = index === selected;
					return (
						<div key={`${feature.name}-${index}`}>
							<button
								className={
									"flex w-full justify-between rounded-lg bg-orange-100 px-4 py-3 text-left text-sm font-medium text-orange-900 hover:bg-orange-200 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-500 focus-visible:ring-opacity-75"
								}
								onClick={() => {
									setSelected(index);
								}}
							>
								<div className="flex w-full items-center justify-between ">
									<div className="flex w-full items-center justify-between">
										<div className="flex items-center">
											<feature.Icon />
											<h3 className="font-sans font-medium text-black">{feature.name}</h3>
										</div>
										{<AltArrowUp className={`${isSelected ? "rotate-180 transform" : ""} h-5 w-5 text-orange-600`} />}
									</div>
								</div>
							</button>

							<p
								className={`mb-[6px] mt-[6px] overflow-hidden  border-gray-700 bg-white pl-[10px] text-[14px] font-medium text-gray-700 transition-all duration-500 ${
									isSelected ? "max-h-28" : "max-h-0"
								} `}
							>
								{feature.description}
							</p>
						</div>
					);
				})}
			</div>
			<div className="relative max-w-xl overflow-hidden whitespace-nowrap rounded-lg border bg-white shadow-sm lg:mt-[30px] lg:h-[360px] lg:w-[860px]">
				<video
					playsInline
					autoPlay
					muted
					loop
					width="1200"
					height="400"
					src={features[selected].demoUrl ? features[selected].demoUrl : features[selected].screenshotUrl}
					poster={features[selected].screenshotUrl}
				>
					Your browser does not support the video tag.
				</video>
			</div>
		</>
	);
}
