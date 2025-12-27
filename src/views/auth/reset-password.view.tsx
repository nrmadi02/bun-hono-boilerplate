/** @jsxImportSource hono/jsx */
/** biome-ignore-all lint/a11y/noSvgWithoutTitle: <> */

import type { FC, PropsWithChildren } from "hono/jsx";

const Layout: FC<PropsWithChildren> = (props) => {
	return (
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Reset Password - Bun Hono</title>
				<link rel="stylesheet" href="/static/styles/global.css" />
			</head>
			<body>{props.children}</body>
		</html>
	);
};

interface ResetPasswordViewProps {
	token?: string;
	error?: string;
	success?: boolean;
	message?: string;
}

export const ResetPasswordView = ({
	token,
	error,
	success,
	message,
}: ResetPasswordViewProps = {}) => {
	const isSuccess = success === true;
	const hasError = !!error;
	const displayMessage =
		message ||
		(isSuccess
			? "Password berhasil direset! Anda sekarang dapat login dengan password baru."
			: "Silakan masukkan password baru Anda.");

	return (
		<Layout>
			<div class="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
				<div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 md:p-10">
					{/* Icon Container */}
					<div class="flex justify-center mb-6">
						<div
							class={`w-20 h-20 rounded-full flex items-center justify-center ${
								isSuccess
									? "bg-green-50"
									: hasError
										? "bg-red-50"
										: "bg-blue-50"
							}`}
						>
							{isSuccess ? (
								<svg
									class="w-10 h-10 text-green-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							) : hasError ? (
								<svg
									class="w-10 h-10 text-red-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							) : (
								<svg
									class="w-10 h-10 text-blue-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
									/>
								</svg>
							)}
						</div>
					</div>

					<h1 class="text-2xl md:text-3xl font-bold text-center mb-3 text-gray-900">
						{isSuccess
							? "Password Berhasil Direset!"
							: hasError
								? "Reset Password Gagal"
								: "Reset Password"}
					</h1>

					{isSuccess ? (
						<div>
							<p class="text-gray-600 text-center mb-6 leading-relaxed">
								{displayMessage}
							</p>
							<a
								href="/auth/login"
								class="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center"
							>
								Kembali ke Login
							</a>
						</div>
					) : hasError ? (
						<div>
							<p class="text-gray-600 text-center mb-6 leading-relaxed">
								{displayMessage}
							</p>
							<a
								href="/auth/forgot-password"
								class="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center"
							>
								Minta Link Reset Baru
							</a>
						</div>
					) : (
						<div>
							<p class="text-gray-600 text-center mb-6 leading-relaxed">
								{displayMessage}
							</p>

							{!token ? (
								<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
									<p class="text-red-600 text-sm">
										Token tidak ditemukan. Silakan periksa link reset password
										Anda.
									</p>
								</div>
							) : (
								<div id="resetPasswordApp">
									{/* Error Message */}
									<div id="errorMessage" class="hidden mb-4">
										<div class="bg-red-50 border border-red-200 rounded-lg p-3">
											<p class="text-red-600 text-sm" id="errorText"></p>
										</div>
									</div>

									{/* Form */}
									<form id="resetPasswordForm" class="space-y-4">
										<input type="hidden" id="token" value={token} />

										<div>
											<label
												for="password"
												class="block text-sm font-medium text-gray-700 mb-2"
											>
												Password Baru
											</label>
											<input
												type="password"
												id="password"
												required
												minlength={8}
												class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
												placeholder="Masukkan password baru (min. 8 karakter)"
											/>
										</div>

										<div>
											<label
												for="confirmPassword"
												class="block text-sm font-medium text-gray-700 mb-2"
											>
												Konfirmasi Password
											</label>
											<input
												type="password"
												id="confirmPassword"
												required
												minlength={8}
												class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
												placeholder="Konfirmasi password baru"
											/>
										</div>

										<button
											type="submit"
											id="submitButton"
											class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
										>
											<span id="submitText">Reset Password</span>
											<span id="submitLoading" class="hidden">
												Memproses...
											</span>
										</button>
									</form>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{token && (
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: <>
					dangerouslySetInnerHTML={{
						__html: `
					(function() {
						// useState-like state management
						function useState(initialValue) {
							let value = initialValue;
							const listeners = [];
							
							const getValue = () => value;
							
							const setValue = (newValue) => {
								const oldValue = value;
								value = typeof newValue === 'function' ? newValue(value) : newValue;
								
								// Notify listeners
								listeners.forEach(listener => listener(value, oldValue));
								updateUI();
							};
							
							const subscribe = (listener) => {
								listeners.push(listener);
								return () => {
									const index = listeners.indexOf(listener);
									if (index > -1) listeners.splice(index, 1);
								};
							};
							
							return [getValue, setValue, subscribe];
						}

						// useEffect-like function
						let effectId = 0;
						const effectCache = new Map();
						
						function useEffect(callback, deps) {
							const id = effectId++;
							const depsString = JSON.stringify(deps);
							
							const cached = effectCache.get(id);
							if (cached && cached.deps === depsString) {
								return;
							}
							
							callback();
							effectCache.set(id, { deps: depsString });
						}

						// DOM elements
						const form = document.getElementById('resetPasswordForm');
						const passwordInput = document.getElementById('password');
						const confirmPasswordInput = document.getElementById('confirmPassword');
						const tokenInput = document.getElementById('token');
						const submitButton = document.getElementById('submitButton');
						const submitText = document.getElementById('submitText');
						const submitLoading = document.getElementById('submitLoading');
						const errorMessage = document.getElementById('errorMessage');
						const errorText = document.getElementById('errorText');

						// useState hooks
						const [getPassword, setPassword] = useState('');
						const [getConfirmPassword, setConfirmPassword] = useState('');
						const [getLoading, setLoading] = useState(false);
						const [getError, setError] = useState(null);

						// Track previous values for useEffect
						let prevPassword = '';
						let prevConfirmPassword = '';

						// useEffect - reset error when password changes
						function checkPasswordChange() {
							const currentPassword = getPassword();
							const currentConfirmPassword = getConfirmPassword();
							
							if ((currentPassword !== prevPassword || currentConfirmPassword !== prevConfirmPassword) && getError()) {
								setError(null);
							}
							
							prevPassword = currentPassword;
							prevConfirmPassword = currentConfirmPassword;
						}

						// Update UI based on state
						function updateUI() {
							// Update button state
							if (getLoading()) {
								submitButton.disabled = true;
								submitText.classList.add('hidden');
								submitLoading.classList.remove('hidden');
							} else {
								submitButton.disabled = false;
								submitText.classList.remove('hidden');
								submitLoading.classList.add('hidden');
							}

							// Update error message
							const error = getError();
							if (error) {
								errorText.textContent = error;
								errorMessage.classList.remove('hidden');
							} else {
								errorMessage.classList.add('hidden');
							}
						}

						// Handle input changes
						passwordInput.addEventListener('input', (e) => {
							setPassword(e.target.value);
							checkPasswordChange();
						});

						confirmPasswordInput.addEventListener('input', (e) => {
							setConfirmPassword(e.target.value);
							checkPasswordChange();
						});

						// Handle form submission
						form.addEventListener('submit', async (e) => {
							e.preventDefault();
							
							const password = passwordInput.value;
							const confirmPassword = confirmPasswordInput.value;
							const token = tokenInput.value;

							// Reset error
							setError(null);

							// Client-side validation
							if (password !== confirmPassword) {
								setError('Password dan konfirmasi password tidak cocok.');
								return;
							}

							if (password.length < 8) {
								setError('Password harus minimal 8 karakter.');
								return;
							}

							// Set loading state
							setLoading(true);

							try {
								// Hit API endpoint
								const response = await fetch('/api/v1/auth/reset-password', {
									method: 'POST',
									headers: {
										'Content-Type': 'application/json',
									},
									body: JSON.stringify({
										token,
										password,
										confirmPassword,
									}),
								});

								const data = await response.json();

								if (response.ok && data.success) {
									// Success - redirect to success page
									window.location.href = '/auth/reset-password?success=true&message=' + 
										encodeURIComponent(data.message || 'Password berhasil direset!');
								} else {
									// Show error
									const errorMsg = data.message || data.errors?.[0] || 'Terjadi kesalahan saat mereset password.';
									setError(errorMsg);
									setLoading(false);
								}
							} catch (err) {
								setError('Terjadi kesalahan saat mereset password. Silakan coba lagi.');
								setLoading(false);
							}
						});

						// Initialize UI
						updateUI();
					})();
				`,
					}}
				/>
			)}
		</Layout>
	);
};
