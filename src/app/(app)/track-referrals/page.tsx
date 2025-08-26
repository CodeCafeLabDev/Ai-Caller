"use client";

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Users, TrendingUp, Calendar, Copy, Download } from 'lucide-react';
import { API_BASE_URL } from '@/lib/apiConfig';

type SalesPerson = {
	id: number;
	name: string;
	email: string;
	phone?: string;
	referral_code: string;
	total_referrals: number;
	monthly_referrals: number;
	total_referrals_count?: number;
	monthly_referrals_count?: number;
	status: 'active' | 'inactive';
	created_at: string;
};

type Referral = {
	id: number;
	sales_person_id: number;
	client_id: number;
	referral_code: string;
	referred_at: string;
	status: 'pending' | 'converted' | 'expired';
	plan_subscribed?: string | null;
	is_trial?: 0 | 1 | boolean;
	conversion_date?: string | null;
	revenue_generated?: number | null;
	commission_calculated?: number | null;
	commission_status?: 'pending' | 'approved' | 'paid';
	companyName: string;
	companyEmail: string;
	contactPersonName: string;
	phoneNumber: string;
	client_created_at: string;
};

export default function TrackReferralsAdminPage() {
	const [salesPerson, setSalesPerson] = useState<SalesPerson | null>(null);
	const [referrals, setReferrals] = useState<Referral[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [plan, setPlan] = useState<string>('');
	const [clientStatus, setClientStatus] = useState<string>('');
	const [commissionStatus, setCommissionStatus] = useState<string>('');
	const [updatingId, setUpdatingId] = useState<number | null>(null);
	const [commissionEdits, setCommissionEdits] = useState<Record<number, { status?: string; amount?: string }>>({});
	const { toast } = useToast();

	useEffect(() => {
		const fetchAll = async () => {
			try {
				const meRes = await fetch(`${API_BASE_URL}/api/sales-persons/me`, { credentials: 'include' });
				if (!meRes.ok) throw new Error('Failed to load your sales profile');
				const meJson = await meRes.json();
				setSalesPerson(meJson.data || null);

				if (meJson.data) {
					const params = new URLSearchParams();
					if (search) params.set('q', search);
					if (plan) params.set('plan', plan);
					if (clientStatus) params.set('clientStatus', clientStatus);
					if (commissionStatus) params.set('commissionStatus', commissionStatus);
					const rfRes = await fetch(`${API_BASE_URL}/api/sales-persons/me/referrals?${params.toString()}`, { credentials: 'include' });
					if (!rfRes.ok) throw new Error('Failed to load referrals');
					const rfJson = await rfRes.json();
					setReferrals(rfJson.data || []);
				}
			} catch (e: any) {
				toast({ title: 'Error', description: e?.message || 'Failed to load data', variant: 'destructive' });
			} finally {
				setLoading(false);
			}
		};
		fetchAll();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search, plan, clientStatus, commissionStatus]);

	const copyReferralCode = (code: string) => {
		navigator.clipboard.writeText(code);
		toast({ title: 'Copied', description: 'Referral code copied to clipboard' });
	};

	const getStatusBadgeVariant = (status: string) => {
		switch (status) {
			case 'converted':
				return 'default';
			case 'pending':
				return 'secondary';
			case 'expired':
				return 'destructive';
			default:
				return 'outline';
		}
	};

	const getCommissionBadge = (status?: string) => {
		switch (status) {
			case 'pending':
				return <Badge className="bg-orange-500 hover:bg-orange-600">Pending</Badge>;
			case 'approved':
				return <Badge>Approved</Badge>;
			case 'paid':
				return <Badge className="bg-blue-600 hover:bg-blue-700">Paid</Badge>;
			default:
				return <Badge variant="outline">N/A</Badge>;
		}
	};

	const exportCsv = async () => {
		try {
			const params = new URLSearchParams();
			if (search) params.set('q', search);
			if (plan) params.set('plan', plan);
			if (clientStatus) params.set('clientStatus', clientStatus);
			if (commissionStatus) params.set('commissionStatus', commissionStatus);
			const res = await fetch(`${API_BASE_URL}/api/sales-persons/me/referrals/export?${params.toString()}`, { credentials: 'include' });
			if (!res.ok) throw new Error('Export failed');
			const blob = await res.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'referrals.csv';
			a.click();
			window.URL.revokeObjectURL(url);
		} catch (e: any) {
			toast({ title: 'Export error', description: e?.message || 'Failed to export', variant: 'destructive' });
		}
	};

	const saveCommission = async (refId: number) => {
		try {
			setUpdatingId(refId);
			const payload = commissionEdits[refId] || {};
			if (!payload.status && payload.amount == null) {
				setUpdatingId(null);
				return;
			}
			const res = await fetch(`${API_BASE_URL}/api/referrals/${refId}/commission`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ commission_status: payload.status, commission_amount: payload.amount })
			});
			if (!res.ok) throw new Error('Failed updating commission');
			toast({ title: 'Updated', description: 'Commission updated' });
			// Refresh
			const params = new URLSearchParams();
			if (search) params.set('q', search);
			if (plan) params.set('plan', plan);
			if (clientStatus) params.set('clientStatus', clientStatus);
			if (commissionStatus) params.set('commissionStatus', commissionStatus);
			const rfRes = await fetch(`${API_BASE_URL}/api/sales-persons/me/referrals?${params.toString()}`, { credentials: 'include' });
			const rfJson = await rfRes.json();
			setReferrals(rfJson.data || []);
		} catch (e: any) {
			toast({ title: 'Error', description: e?.message || 'Failed to update', variant: 'destructive' });
		} finally {
			setUpdatingId(null);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-lg">Loading referrals...</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Track Referrals</h1>
				<p className="text-muted-foreground">Monitor your own referrals and performance</p>
			</div>

			{!salesPerson ? (
				<Card>
					<CardHeader>
						<CardTitle>No Sales Profile Found</CardTitle>
						<CardDescription>
							Your admin account email is not associated with any sales profile. Please contact an administrator.
						</CardDescription>
					</CardHeader>
				</Card>
			) : (
				<>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
								<Users className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{referrals.length}</div>
								<p className="text-xs text-muted-foreground">All time referrals</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Converted Clients</CardTitle>
								<TrendingUp className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{referrals.filter(r => r.status === 'converted').length}</div>
								<p className="text-xs text-muted-foreground">Converted to paid</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
								<Copy className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">₹ {referrals.reduce((s, r) => s + Number(r.revenue_generated || 0), 0).toFixed(2)}</div>
								<p className="text-xs text-muted-foreground">From referred clients</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Commission</CardTitle>
								<Calendar className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">₹ {referrals.reduce((s, r) => s + Number(r.commission_calculated || 0), 0).toFixed(2)}</div>
								<p className="text-xs text-muted-foreground">Pending: ₹ {referrals.filter(r => r.commission_status !== 'paid').reduce((s, r) => s + Number(r.commission_calculated || 0), 0).toFixed(2)}</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Your Referral Code</CardTitle>
								<Copy className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<code className="bg-muted px-2 py-1 rounded text-sm font-mono">{salesPerson.referral_code}</code>
									<button onClick={() => copyReferralCode(salesPerson.referral_code)} className="text-muted-foreground hover:text-foreground">
										<Copy className="h-4 w-4" />
									</button>
								</div>
								<p className="text-xs text-muted-foreground mt-1">Share this code with potential clients</p>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Referred Clients</CardTitle>
							<CardDescription>All clients who registered using your referral code</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex flex-col md:flex-row gap-2 md:items-end mb-4">
								<Input placeholder="Search by name, email, code..." value={search} onChange={(e) => setSearch(e.target.value)} className="md:w-64" />
								<Select value={plan || 'ALL'} onValueChange={(v) => setPlan(v === 'ALL' ? '' : v)}>
									<SelectTrigger className="w-[180px]"><SelectValue placeholder="Plan" /></SelectTrigger>
									<SelectContent>
										<SelectItem value="ALL">All Plans</SelectItem>
										<SelectItem value="Trial">Trial</SelectItem>
										<SelectItem value="Basic">Basic</SelectItem>
										<SelectItem value="Premium">Premium</SelectItem>
										<SelectItem value="Enterprise">Enterprise</SelectItem>
									</SelectContent>
								</Select>
								<Select value={clientStatus || 'ALL'} onValueChange={(v) => setClientStatus(v === 'ALL' ? '' : v)}>
									<SelectTrigger className="w-[180px]"><SelectValue placeholder="Client Status" /></SelectTrigger>
									<SelectContent>
										<SelectItem value="ALL">All Clients</SelectItem>
										<SelectItem value="trial">Trial</SelectItem>
										<SelectItem value="paid">Paid</SelectItem>
									</SelectContent>
								</Select>
								<Select value={commissionStatus || 'ALL'} onValueChange={(v) => setCommissionStatus(v === 'ALL' ? '' : v)}>
									<SelectTrigger className="w-[200px]"><SelectValue placeholder="Commission Status" /></SelectTrigger>
									<SelectContent>
										<SelectItem value="ALL">All</SelectItem>
										<SelectItem value="pending">Pending</SelectItem>
										<SelectItem value="approved">Approved</SelectItem>
										<SelectItem value="paid">Paid</SelectItem>
									</SelectContent>
								</Select>
								<div className="flex-1" />
								<Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
							</div>
							{referrals.length === 0 ? (
								<div className="text-center py-8">
									<Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
									<h3 className="text-lg font-semibold mb-2">No referrals yet</h3>
									<p className="text-muted-foreground">Share your referral code with potential clients to start earning referrals.</p>
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Referral Code</TableHead>
											<TableHead>Client Name</TableHead>
											<TableHead>Contact</TableHead>
											<TableHead>Plan</TableHead>
											<TableHead>Trial</TableHead>
											<TableHead>Conversion</TableHead>
											<TableHead>Signup</TableHead>
											<TableHead>Conversion Date</TableHead>
											<TableHead>Revenue</TableHead>
											<TableHead>Commission</TableHead>
											<TableHead>Commission Status</TableHead>
											<TableHead>Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{referrals.map((ref) => (
											<TableRow key={ref.id}>
												<TableCell className="font-mono text-xs">{ref.referral_code}</TableCell>
												<TableCell className="font-medium">{ref.companyName}</TableCell>
												<TableCell>
													<div className="flex flex-col">
														<span>{ref.companyEmail}</span>
														<span className="text-muted-foreground text-xs">{ref.phoneNumber}</span>
													</div>
												</TableCell>
												<TableCell>{ref.plan_subscribed || '-'}</TableCell>
												<TableCell>{(ref.is_trial ? 1 : 0) === 1 ? <Badge className="bg-yellow-500 hover:bg-yellow-600">Yes</Badge> : <Badge>No</Badge>}</TableCell>
												<TableCell>
													<Badge variant={getStatusBadgeVariant(ref.status)}>{ref.status === 'converted' ? 'Converted to Paid' : 'Still in Trial'}</Badge>
												</TableCell>
												<TableCell>{new Date(ref.referred_at).toLocaleDateString()}</TableCell>
												<TableCell>{ref.conversion_date ? new Date(ref.conversion_date).toLocaleDateString() : '-'}</TableCell>
												<TableCell>₹ {Number(ref.revenue_generated || 0).toFixed(2)}</TableCell>
												<TableCell>₹ {Number(ref.commission_calculated || 0).toFixed(2)}</TableCell>
												<TableCell>{getCommissionBadge(ref.commission_status)}</TableCell>
												<TableCell>
													<div className="flex items-center gap-2">
														<Select value={commissionEdits[ref.id]?.status ?? ''} onValueChange={(v) => setCommissionEdits(prev => ({ ...prev, [ref.id]: { ...(prev[ref.id]||{}), status: v } }))}>
															<SelectTrigger className="w-[140px]"><SelectValue placeholder="Set status" /></SelectTrigger>
															<SelectContent>
																<SelectItem value="pending">Pending</SelectItem>
																<SelectItem value="approved">Approved</SelectItem>
																<SelectItem value="paid">Paid</SelectItem>
															</SelectContent>
														</Select>
														<Input type="number" step="0.01" placeholder="Amount" className="w-28"
															value={commissionEdits[ref.id]?.amount ?? ''}
															onChange={(e) => setCommissionEdits(prev => ({ ...prev, [ref.id]: { ...(prev[ref.id]||{}), amount: e.target.value } }))}
														/>
														<Button size="sm" disabled={updatingId === ref.id} onClick={() => saveCommission(ref.id)}>Save</Button>
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
