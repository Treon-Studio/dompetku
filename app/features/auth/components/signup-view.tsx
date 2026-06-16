import Footer from "~/shared/components/footer";
import SignUpForm from "./signup-form";

export default function SignUpView() {
	return (
		<main
			className={`relative m-auto flex h-screen w-full flex-col items-center justify-center bg-linear-to-br from-orange-100 via-white to-orange-50 pl-2 pr-2`}
		>
			<div className="absolute inset-x-0 top-[-55px] z-10 h-96 overflow-hidden text-gray-900/40 opacity-10 mask-[linear-gradient(to_top,transparent,white)]">
				<svg className="absolute inset-0 top-0 h-full w-full text-gray-900" xmlns="http://www.w3.org/2000/svg">
					<title>Background pattern</title>
					<defs>
						<pattern
							id="pattern"
							width="32"
							height="32"
							patternUnits="userSpaceOnUse"
							x="50%"
							y="100%"
							patternTransform="translate(0 -1)"
						>
							<path d="M0 32V.5H32" fill="none" stroke="currentColor"></path>
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill="url(#pattern)"></rect>
				</svg>
			</div>
			<div className="absolute z-50 m-auto flex w-[380px] flex-1 flex-col justify-center p-6 sm:w-[468px] sm:p-10">
				<a href="/">
					<h1 className="flex flex-col items-center text-3xl">
						<img className="active:scale-95" src="/icons/logo.png" width={50} height={50} alt="dompetku logo" />
						<span className="mt-2 font-black text-gray-900">Dompetku</span>
					</h1>
				</a>
				<p className="mb-6 mt-3 text-center text-sm font-medium text-zinc-600">
					Get started for free. No credit card required.
				</p>
				<SignUpForm />
			</div>
			<Footer className={"absolute bottom-0"} />
		</main>
	);
}
