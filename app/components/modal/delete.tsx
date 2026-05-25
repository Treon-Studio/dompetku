'use client';

import { useState } from 'react';

import { useUser } from '~/components/context/auth-provider';
import CircleLoader from '~/components/loader/circle';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { useTranslation } from '@i18n/client';

import Modal from '.';

export default function DeleteModal({ show, onHide }: { show: boolean; onHide: () => void }) {
	const { t } = useTranslation();
	const user = useUser();
	const [loading, setLoading] = useState(false);
	const [verify, setVerify] = useState('');

	const onDelete = async () => {
		if (verify === user.email) {
			setLoading(true);
			await fetch('/api/user', { method: 'DELETE' });
			setLoading(false);
			window.location.href = '/signup';
		}
	};

	return (
		<Modal show={show} title={t('modal.deleteAccount')} onHide={onHide} someRef={null}>
			<div className="text-sm text-primary dark:text-muted-foreground">
				{t('modal.deleteAccountConfirm')}
			</div>
			<Input
				className="mt-3"
				placeholder={t('auth.email')}
				type="email"
				onChange={(event) => {
					setVerify(event.target.value);
				}}
			/>
			<Button
				onClick={onDelete}
				variant={'destructive'}
				disabled={loading || verify !== user.email}
				className="user-select-none mt-4 w-full"
			>
				{loading ? <CircleLoader /> : t('common.delete')}
			</Button>
		</Modal>
	);
}