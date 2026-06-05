import { useState } from 'react';
import type { MetaFunction } from '@remix-run/cloudflare';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import LayoutHeader from '~/shared/components/layout/header';
import { Button } from '~/shared/components/ui/button';
import { Switch } from '~/shared/components/ui/switch';
import { Input } from '~/shared/components/ui/input';

export const meta: MetaFunction = () => {
	return [
		{ title: 'Dompetku - Settings' },
	];
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminSettingsPage() {
	const { data: settings = [], refetch: mutate, isLoading } = useQuery({ 
		queryKey: ['admin-settings'], 
		queryFn: () => fetcher('/api/admin/settings') 
	});

	const [newFlagKey, setNewFlagKey] = useState('');
	const [newFlagDesc, setNewFlagDesc] = useState('');

	const handleAction = async (key: string, action: 'TOGGLE' | 'DELETE', description?: string) => {
		if (action === 'DELETE' && key === 'maintenance_mode') {
			toast.error('Cannot delete the master maintenance mode flag');
			return;
		}

		if (action === 'DELETE') {
			if (!window.confirm('Are you sure you want to delete this setting?')) return;
		}

		const res = await fetch('/api/admin/settings', {
			method: 'POST',
			body: JSON.stringify({ key, action, description }),
			headers: { 'Content-Type': 'application/json' },
		});
		
		if (res.ok) {
			const data = (await res.json()) as any;
			toast.success(data.message);
			if (action === 'TOGGLE' && newFlagKey) {
				setNewFlagKey('');
				setNewFlagDesc('');
			}
			mutate();
		} else {
			toast.error('Action failed');
		}
	};

	const maintenanceFlag = (settings as any[]).find((s: any) => s.key === 'maintenance_mode');
	const featureFlags = (settings as any[]).filter((s: any) => s.key !== 'maintenance_mode');

	return (
		<>
			<LayoutHeader title="System Settings" />
			<div className="p-6 space-y-8 max-w-4xl">
				
				{/* Maintenance Mode Section */}
				<div className="bg-card border rounded-lg overflow-hidden shadow-sm p-6">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-lg font-bold text-red-600">Maintenance Mode</h3>
							<p className="text-sm text-gray-500 mt-1">
								When active, all users will be redirected to the maintenance page. Admins can still log in.
							</p>
						</div>
						<div className="flex items-center gap-3">
							<span className="text-sm font-medium">
								{maintenanceFlag?.value === 'true' ? 'Active' : 'Inactive'}
							</span>
							<Switch 
								checked={maintenanceFlag?.value === 'true'} 
								onCheckedChange={() => handleAction('maintenance_mode', 'TOGGLE')}
							/>
						</div>
					</div>
				</div>

				{/* Feature Flags Section */}
				<div className="bg-card border rounded-lg shadow-sm">
					<div className="p-6 border-b">
						<h3 className="text-lg font-bold">Feature Flags</h3>
						<p className="text-sm text-gray-500 mt-1">
							Dynamically enable or disable features across the application.
						</p>
					</div>
					
					<div className="p-6 space-y-6">
						{/* Add New Flag */}
						<div className="flex gap-4 items-end bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
							<div className="flex-1">
								<label className="text-xs font-semibold mb-1 block">Flag Key</label>
								<Input 
									placeholder="e.g. new_charts_ui" 
									value={newFlagKey}
									onChange={(e) => setNewFlagKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
								/>
							</div>
							<div className="flex-1">
								<label className="text-xs font-semibold mb-1 block">Description</label>
								<Input 
									placeholder="What does this toggle?" 
									value={newFlagDesc}
									onChange={(e) => setNewFlagDesc(e.target.value)}
								/>
							</div>
							<Button onClick={() => handleAction(newFlagKey, 'TOGGLE', newFlagDesc)} disabled={!newFlagKey}>
								Create Flag
							</Button>
						</div>

						{/* Flags List */}
						<div className="divide-y border rounded-lg">
							{isLoading && <div className="p-4 text-center text-gray-500">Loading flags...</div>}
							{!isLoading && featureFlags.length === 0 && (
								<div className="p-6 text-center text-gray-500">No custom feature flags defined.</div>
							)}
							{featureFlags.map((flag: any) => (
								<div key={flag.key} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
									<div>
										<h4 className="font-semibold text-primary">{flag.key}</h4>
										<p className="text-sm text-gray-500">{flag.description || 'No description'}</p>
									</div>
									<div className="flex items-center gap-4">
										<Switch 
											checked={flag.value === 'true'} 
											onCheckedChange={() => handleAction(flag.key, 'TOGGLE')}
										/>
										<Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleAction(flag.key, 'DELETE')}>
											Delete
										</Button>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
