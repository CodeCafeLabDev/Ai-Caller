
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, FileText, DollarSign, Download, Edit, CalendarClock, RotateCcw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Mock data for client billing
const mockBillingInfo = {
  currentPlan: "Premium Monthly",
  nextBillingDate: "August 15, 2024",
  paymentMethod: "Visa **** **** **** 1234",
  monthlyCost: "$99.00 USD",
};

const mockInvoices = [
  { id: "inv_c1_001", date: "2024-07-15", amount: "$99.00", status: "Paid", description: "Premium Monthly - July" },
  { id: "inv_c1_002", date: "2024-06-15", amount: "$99.00", status: "Paid", description: "Premium Monthly - June" },
  { id: "inv_c1_003", date: "2024-05-15", amount: "$99.00", status: "Paid", description: "Premium Monthly - May" },
];

const statusVariants = {
  Paid: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Failed: "bg-red-100 text-red-700",
};

export default function ClientBillingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline flex items-center">
        <CreditCard className="mr-2 h-7 w-7" /> Billing & Invoices
      </h1>
      <p className="text-muted-foreground">Manage your subscription, payment methods, and view invoices.</p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><DollarSign className="mr-2 h-5 w-5" />Current Subscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <p className="font-semibold">{mockBillingInfo.currentPlan}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Cost</p>
              <p className="font-semibold">{mockBillingInfo.monthlyCost}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Next Billing Date</p>
              <p className="font-semibold flex items-center"><CalendarClock className="inline-block mr-1 h-4 w-4 text-muted-foreground"/>{mockBillingInfo.nextBillingDate}</p>
            </div>
             <div>
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="font-semibold flex items-center"><CreditCard className="inline-block mr-1 h-4 w-4 text-muted-foreground"/>{mockBillingInfo.paymentMethod}</p>
            </div>
          </div>
          <div className="flex gap-2 pt-3">
            <Button variant="outline"><Edit className="mr-2 h-4 w-4"/>Update Payment Method</Button>
            <Button variant="outline" disabled><RotateCcw className="mr-2 h-4 w-4"/>Change Plan (Contact Support)</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5" />Invoice History</CardTitle>
          <CardDescription>Download or view your past invoices.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.description}</TableCell>
                  <TableCell>{invoice.amount}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${statusVariants[invoice.status as keyof typeof statusVariants]}`}>{invoice.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm"><Download className="mr-2 h-3 w-3"/>Download PDF</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {mockInvoices.length === 0 && <p className="p-4 text-center text-muted-foreground">No invoices found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
