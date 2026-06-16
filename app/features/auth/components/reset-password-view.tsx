import { useTranslation } from "@i18n/client";
import { Link } from "@remix-run/react";
import { useState } from "react";

import Footer from "~/shared/components/footer";
import CircleLoader from "~/shared/components/loader/circle";
import { Button } from "~/shared/components/ui/button";
import url from "~/shared/constants/url";
import { apiUrls } from "~/shared/lib/apiUrls";

export default function ResetPasswordView({ token }: { token: string }) {
	const { t } = useTranslation();
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (password !== confirmPassword) {
			setError(t("auth.passwordMismatch"));
			return;
		}

		if (password.length < 6) {
			setError("Password must be at least 6 characters");
			return;
		}

		if (password.length > 128) {
			setError("Password must be at most 128 characters");
			return;
		}

		setLoading(true);

		try {
			const res = await fetch(apiUrls.auth.resetPassword, {
				method: "POST",
				body: JSON.stringify({ token, password }),
				headers: { "Content-Type": "application/json" },
			});

			const data = (await res.json()) as { message?: string };
			if (res.ok) {
				setMessage(data.message || "");
			} else {
				setError(data.message || "");
			}
		} catch {
			setError("An error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="relative m-auto flex h-screen w-full flex-col items-center justify-center bg-linear-to-br from-sky-100 via-white to-sky-50 pl-2 pr-2">
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
				<p className="mb-6 mt-3 text-center text-sm font-medium text-zinc-600">{t("auth.resetPassword")}</p>
				{message ? (
					<div className="space-y-4">
						<div className="rounded-md bg-green-50 p-4 text-center text-sm text-green-700">{message}</div>
						<Link
							to={url.app.signin}
							className="block text-center text-sm font-medium text-gray-700 underline hover:text-gray-600"
						>
							{t("auth.signin")}
						</Link>
					</div>
				) : (
					<form className="grid w-full grid-cols-1 items-center gap-4 text-gray-800" onSubmit={handleSubmit}>
						<label className="mb-1 block">
							<span className="mb-2 block text-sm font-semibold leading-6">{t("auth.newPassword")}</span>
							<input
								className="mt-2 block h-10 w-full appearance-none rounded-md bg-white px-3 text-sm text-black shadow-xs ring-1 ring-gray-300 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-gray-900"
								type="password"
								placeholder="********"
								required
								minLength={6}
								maxLength={128}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</label>
						<label className="mb-1 block">
							<span className="mb-2 block text-sm font-semibold leading-6">{t("auth.confirmPassword")}</span>
							<input
								className="mt-2 block h-10 w-full appearance-none rounded-md bg-white px-3 text-sm text-black shadow-xs ring-1 ring-gray-300 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-gray-900"
								type="password"
								placeholder="********"
								required
								minLength={6}
								maxLength={128}
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
							/>
						</label>
						<Button size="lg" type="submit" disabled={loading}>
							{loading ? <CircleLoader /> : t("auth.resetPassword")}
						</Button>
						{error && <p className="text-center text-sm text-red-500">{error}</p>}
					</form>
				)}
			</div>
			<Footer className="absolute bottom-0" />
		</main>
	);
}
