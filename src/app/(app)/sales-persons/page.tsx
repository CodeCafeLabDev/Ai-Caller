"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, Copy, Eye } from 'lucide-react';
import { API_BASE_URL, api } from '@/lib/apiConfig';

interface SalesPerson {
  id: number;
  admin_user_id?: number;
  name: string;
  email: string;
  phone: string;
  referral_code: string;
  total_referrals: number;
  monthly_referrals: number;
  total_referrals_count: number;
  monthly_referrals_count: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export default function SalesPersonsPage() {
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSalesPerson, setEditingSalesPerson] = useState<SalesPerson | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    status: 'Active' as 'Active' | 'Suspended',
    referral_code: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSalesPersons();
  }, []);

  const fetchSalesPersons = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales-persons`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch sales persons');
      }
      
      const data = await response.json();
      setSalesPersons(data.data || []);
    } catch (error) {
      console.error('Error fetching sales persons:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sales persons",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.name || !formData.email || !formData.password || formData.password !== formData.confirmPassword) {
        throw new Error('Please fill name, email, matching password fields');
      }
      const payload = {
        name: formData.name,
        email: formData.email,
        roleName: 'sales admin',
        password: formData.password,
        status: formData.status,
        lastLogin: null,
        referral_code: formData.referral_code || ''
      };
      const res = await api.createAdminUser(payload);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || 'Failed to create user');
      }
      await fetchSalesPersons();
      setIsCreateOpen(false);
      setFormData({ name: '', email: '', password: '', confirmPassword: '', status: 'Active', referral_code: '' });
      
      toast({
        title: 'Success',
        description: 'Reseller created successfully',
      });
    } catch (error) {
      console.error('Error creating sales person:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create reseller',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = async () => {
    if (!editingSalesPerson) return;

    try {
      const adminUserId = editingSalesPerson.admin_user_id || editingSalesPerson.id;
      const payload: any = {
        name: formData.name,
        email: formData.email,
        roleName: 'sales admin',
        status: formData.status,
        referral_code: formData.referral_code || ''
      };
      if (formData.password && formData.password === formData.confirmPassword) {
        payload.password = formData.password;
      }
      const res = await api.updateAdminUser(String(adminUserId), payload);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || 'Failed to update user');
      }
      await fetchSalesPersons();
      setIsEditOpen(false);
      setEditingSalesPerson(null);
      setFormData({ name: '', email: '', password: '', confirmPassword: '', status: 'Active', referral_code: '' });
      
      toast({
        title: "Success",
        description: "Sales person updated successfully",
      });
    } catch (error) {
      console.error('Error updating sales person:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update sales person",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this sales person?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/sales-persons/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete sales person');
      }

      setSalesPersons(prev => prev.filter(sp => sp.id !== id));
      
      toast({
        title: "Success",
        description: "Sales person deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting sales person:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete sales person",
        variant: "destructive"
      });
    }
  };

  const copyReferralCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: "Referral code copied to clipboard",
    });
  };

  const openEditDialog = (salesPerson: SalesPerson) => {
    setEditingSalesPerson(salesPerson);
    setFormData({
      name: salesPerson.name,
      email: salesPerson.email,
      password: '',
      confirmPassword: '',
      status: (salesPerson.status === 'inactive' ? 'Suspended' : 'Active'),
      referral_code: salesPerson.referral_code || ''
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', confirmPassword: '', status: 'Active', referral_code: '' });
    setEditingSalesPerson(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading sales persons...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reseller Management</h1>
          <p className="text-muted-foreground">
            Manage resellers (sales admins) and track their referral performance
          </p>
        </div>
        <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <SheetTrigger asChild>
            <Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" /> Add Reseller</Button>
          </SheetTrigger>
          <SheetContent side="right" className="sm:max-w-md w-full flex flex-col">
            <div className="py-6 px-4 overflow-y-auto max-h-[calc(100vh-80px)]">
              <SheetHeader>
                <SheetTitle>Add Reseller</SheetTitle>
                <SheetDescription>Create a new sales admin with referral code.</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Name</Label>
                  <Input value={formData.name} onChange={(e)=>setFormData(p=>({...p,name:e.target.value}))} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={(e)=>setFormData(p=>({...p,email:e.target.value}))} />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" value={formData.password} onChange={(e)=>setFormData(p=>({...p,password:e.target.value}))} />
                </div>
                <div>
                  <Label>Confirm Password</Label>
                  <Input type="password" value={formData.confirmPassword} onChange={(e)=>setFormData(p=>({...p,confirmPassword:e.target.value}))} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v: 'Active'|'Suspended')=>setFormData(p=>({...p,status:v}))}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Referral Code</Label>
                  <Input value={formData.referral_code} onChange={(e)=>setFormData(p=>({...p,referral_code:e.target.value}))} placeholder="Leave empty to auto-generate" />
                </div>
              </div>
              <SheetFooter className="mt-6">
                <Button variant="outline" onClick={()=>setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Create</Button>
              </SheetFooter>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resellers Overview</CardTitle>
          <CardDescription>
            Track referral performance and manage sales person accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Referral Code</TableHead>
                <TableHead>Total Referrals</TableHead>
                <TableHead>Monthly Referrals</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesPersons.map((salesPerson) => (
                <TableRow key={salesPerson.id}>
                  <TableCell className="font-medium">{salesPerson.name}</TableCell>
                  <TableCell>{salesPerson.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {salesPerson.referral_code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyReferralCode(salesPerson.referral_code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {salesPerson.total_referrals_count || salesPerson.total_referrals}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {salesPerson.monthly_referrals_count || salesPerson.monthly_referrals}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={salesPerson.status === 'active' ? 'default' : 'secondary'}>
                      {salesPerson.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(salesPerson.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(salesPerson)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(salesPerson.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetContent side="right" className="sm:max-w-md w-full flex flex-col">
          <div className="py-6 px-4 overflow-y-auto max-h-[calc(100vh-80px)]">
            <SheetHeader>
              <SheetTitle>Edit Reseller</SheetTitle>
              <SheetDescription>Update sales admin details and referral code.</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Name</Label>
                <Input value={formData.name} onChange={(e)=>setFormData(p=>({...p,name:e.target.value}))} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e)=>setFormData(p=>({...p,email:e.target.value}))} />
              </div>
              <div>
                <Label>New Password (optional)</Label>
                <Input type="password" value={formData.password} onChange={(e)=>setFormData(p=>({...p,password:e.target.value}))} />
              </div>
              <div>
                <Label>Confirm Password</Label>
                <Input type="password" value={formData.confirmPassword} onChange={(e)=>setFormData(p=>({...p,confirmPassword:e.target.value}))} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v: 'Active'|'Suspended')=>setFormData(p=>({...p,status:v}))}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Referral Code</Label>
                <Input value={formData.referral_code} onChange={(e)=>setFormData(p=>({...p,referral_code:e.target.value}))} />
              </div>
            </div>
            <SheetFooter className="mt-6">
              <Button variant="outline" onClick={()=>setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={handleEdit}>Update</Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
