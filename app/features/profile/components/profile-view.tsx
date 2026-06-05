'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { useUser } from '~/features/auth/components/auth-provider';
import { Button } from '~/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/shared/components/ui/card';
import { Input } from '~/shared/components/ui/input';
import { Label } from '~/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/shared/components/ui/select';
import { Separator } from '~/shared/components/ui/separator';
import { Badge } from '~/shared/components/ui/badge';
import CircleLoader from '~/shared/components/loader/circle';
import { useTheme, useUiActions } from '~/shared/stores/ui/ui.store';
import DeleteModal from '~/shared/components/modal/delete';
import { useTranslation } from '@i18n/client';

import { apiUrls } from '~/shared/lib/apiUrls';
import messages from '~/shared/constants/messages';
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from '~/shared/constants/validation';

const CURRENCIES = [
	{ value: 'IDR', label: 'IDR - Indonesian Rupiah' },
	{ value: 'USD', label: 'USD - US Dollar' },
	{ value: 'EUR', label: 'EUR - Euro' },
	{ value: 'GBP', label: 'GBP - British Pound' },
	{ value: 'JPY', label: 'JPY - Japanese Yen' },
	{ value: 'SGD', label: 'SGD - Singapore Dollar' },
	{ value: 'MYR', label: 'MYR - Malaysian Ringgit' },
	{ value: 'AUD', label: 'AUD - Australian Dollar' },
	{ value: 'INR', label: 'INR - Indian Rupee' },
	{ value: 'CNY', label: 'CNY - Chinese Yuan' },
	{ value: 'KRW', label: 'KRW - South Korean Won' },
	{ value: 'THB', label: 'THB - Thai Baht' },
	{ value: 'PHP', label: 'PHP - Philippine Peso' },
	{ value: 'VND', label: 'VND - Vietnamese Dong' },
	{ value: 'BRL', label: 'BRL - Brazilian Real' },
	{ value: 'CAD', label: 'CAD - Canadian Dollar' },
	{ value: 'CHF', label: 'CHF - Swiss Franc' },
	{ value: 'SEK', label: 'SEK - Swedish Krona' },
];

const LANGUAGES = [
	{ value: 'en', label: 'English' },
	{ value: 'id', label: 'Bahasa Indonesia' },
];

export default function ProfilePage() {
	const { t } = useTranslation();
	const user = useUser();

	const [currency, setCurrency] = useState(user?.currency);
	const [locale, setLocale] = useState(user?.locale);
	const [savingPrefs, setSavingPrefs] = useState(false);

	const [email, setEmail] = useState(user?.email || '');
	const theme = useTheme();
	const { setTheme } = useUiActions();
	const [phone, setPhone] = useState(user?.phone || '');
	const [savingIdentity, setSavingIdentity] = useState(false);

	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [savingPassword, setSavingPassword] = useState(false);

	const [showDeleteModal, setShowDeleteModal] = useState(false);

	const handleSavePreferences = async () => {
		setSavingPrefs(true);
		try {
			const res = await fetch(apiUrls.user.modify, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ currency, locale }),
			});
			if (!res.ok) throw new Error();
			toast.success(messages.updated);
			window.location.reload();
		} catch {
			toast.error(messages.error);
		}
		setSavingPrefs(false);
	};

	const handleSaveIdentity = async () => {
		if (!email && !phone) {
			toast.error('Email or phone number is required');
			return;
		}
		setSavingIdentity(true);
		try {
			const res = await fetch(apiUrls.user.modify, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email || null, phone: phone || null }),
			});
			const data = (await res.json()) as { message?: string };
			if (!res.ok) {
				toast.error(data.message || messages.error);
				return;
			}
			toast.success(messages.updated);
			window.location.reload();
		} catch {
			toast.error(messages.error);
		}
		setSavingIdentity(false);
	};

	const handleChangePassword = async () => {
		if (newPassword.length < PASSWORD_MIN_LENGTH || newPassword.length > PASSWORD_MAX_LENGTH) {
			toast.error(`Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters`);
			return;
		}
		if (newPassword !== confirmPassword) {
			toast.error(t('auth.passwordMismatch'));
			return;
		}
		setSavingPassword(true);
		try {
			const res = await fetch(apiUrls.user.modify, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ currentPassword, newPassword }),
			});
			const data = (await res.json()) as { message?: string };
			if (!res.ok) {
				toast.error(data.message || messages.error);
				return;
			}
			toast.success(t('profile.passwordChanged'));
			setCurrentPassword('');
			setNewPassword('');
			setConfirmPassword('');
		} catch {
			toast.error(messages.error);
		}
		setSavingPassword(false);
	};

	const formatDate = (dateStr: string) => {
		try {
			return new Intl.DateTimeFormat(user?.locale, {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			}).format(new Date(dateStr));
		} catch {
			return dateStr;
		}
	};

	return (
		<div className="w-full overflow-y-auto p-4 pt-3">
			<div className="mx-auto max-w-2xl space-y-6 pb-8">
				<div className="flex items-center gap-4">
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
						{(user?.email || user?.phone || '?')[0].toUpperCase()}
					</div>
					<div>
						<h3 className="text-lg font-semibold">{user?.email || user?.phone}</h3>
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Badge variant={user?.isPremium ? 'default' : 'secondary'}>
								{user?.isPremium ? t('profile.premium') : t('profile.basic')}
							</Badge>
							{user?.trial_start_date && (
								<span>
									{t('profile.memberSince')} {formatDate(user?.trial_start_date)}
								</span>
							)}
						</div>
					</div>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>{t('profile.accountInfo')}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">{t('profile.email')}</Label>
							<Input
								id="email"
								type="email"
								placeholder={t('profile.noEmail')}
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								maxLength={254}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="phone">{t('profile.phone')}</Label>
							<Input
								id="phone"
								type="tel"
								placeholder={t('profile.noPhone')}
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								maxLength={20}
							/>
						</div>
						<Button onClick={handleSaveIdentity} disabled={savingIdentity} className="w-full sm:w-auto">
							{savingIdentity ? <CircleLoader /> : t('common.update')}
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>{t('profile.preferences')}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>{t('profile.currency')}</Label>
							<Select value={currency} onValueChange={setCurrency}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{CURRENCIES.map((c) => (
										<SelectItem key={c.value} value={c.value}>
											{c.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>{t('profile.language')}</Label>
							<Select value={locale} onValueChange={setLocale}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{LANGUAGES.map((l) => (
										<SelectItem key={l.value} value={l.value}>
											{l.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<Button onClick={handleSavePreferences} disabled={savingPrefs} className="w-full sm:w-auto">
							{savingPrefs ? <CircleLoader /> : t('common.save')}
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>{t('profile.changePassword')}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="currentPassword">{t('profile.currentPassword')}</Label>
							<Input
								id="currentPassword"
								type="password"
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
								maxLength={PASSWORD_MAX_LENGTH}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="newPassword">{t('profile.newPassword')}</Label>
							<Input
								id="newPassword"
								type="password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								maxLength={PASSWORD_MAX_LENGTH}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirmNewPassword">{t('profile.confirmNewPassword')}</Label>
							<Input
								id="confirmNewPassword"
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								maxLength={PASSWORD_MAX_LENGTH}
							/>
						</div>
						<Button
							onClick={handleChangePassword}
							disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
							className="w-full sm:w-auto"
						>
							{savingPassword ? <CircleLoader /> : t('profile.changePassword')}
						</Button>
					</CardContent>
				</Card>

				<Card className="border-destructive/50">
					<CardHeader>
						<CardTitle className="text-destructive">{t('profile.dangerZone')}</CardTitle>
						<CardDescription>{t('profile.deleteAccountDesc')}</CardDescription>
					</CardHeader>
					<CardContent>
						<Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
							{t('profile.deleteAccount')}
						</Button>
					</CardContent>
				</Card>
			</div>

			<DeleteModal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} />
		</div>
	);
}
