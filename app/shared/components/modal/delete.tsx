'use client';

import { useState } from 'react';

import { useUser } from '~/features/auth/components/auth-provider';
import CircleLoader from '~/shared/components/loader/circle';
import { Button } from '~/shared/components/ui/button';
import { Input } from '~/shared/components/ui/input';
import { useTranslation } from '@i18n/client';

import Modal from '.';

export default function DeleteModal({ show, onHide }: { show: boolean; onHide: () => void }) {
	const { t } = useTranslation();
	const user = useUser();
	const [loading, setLoading] = useState(false);
	const [verify, setVerify] = useState('');

	const identity = user.email || user.phone;

	const onDelete = async () => {
		if (verify === identity) {
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
				placeholder={identity}
				type="text"
				onChange={(event) => {
					setVerify(event.target.value);
				}}
			/>
			<Button
				onClick={onDelete}
				variant={'destructive'}
				disabled={loading || verify !== identity}
				className="user-select-none mt-4 w-full"
			>
				{loading ? <CircleLoader /> : t('common.delete')}
			</Button>
		</Modal>
	);
}
