
"use client";

import * as React from "react";
import { getItemsAction, addItemAction, deleteItemAction, type Item } from "@/actions/crudExampleActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, List, PlusCircle } from "lucide-react";
import { format } from "date-fns";

export default function SupabaseCrudExamplePage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<Item[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [itemName, setItemName] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchItems = React.useCallback(async () => {
    setIsLoading(true);
    const result = await getItemsAction();
    if (result.success && result.data) {
      setItems(result.data as Item[]);
    } else {
      toast({
        title: "Error Fetching Items",
        description: result.message,
        variant: "destructive",
      });
      setItems([]); // Clear items on error
    }
    setIsLoading(false);
  }, [toast]);

  React.useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAddItem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!itemName.trim()) {
      toast({ title: "Validation Error", description: "Item name cannot be empty.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('name', itemName);
    
    const result = await addItemAction(formData);
    if (result.success) {
      toast({ title: "Item Added", description: result.message });
      setItemName(""); // Clear input
      // Items will be refetched due to revalidatePath in action, or call fetchItems()
    } else {
      toast({
        title: "Error Adding Item",
        description: result.message,
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  const handleDeleteItem = async (itemId: number) => {
    const result = await deleteItemAction(itemId);
    if (result.success) {
      toast({ title: "Item Deleted", description: result.message });
      // Items will be refetched due to revalidatePath in action, or call fetchItems()
    } else {
      toast({
        title: "Error Deleting Item",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3">
        <List className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">Supabase CRUD Example</h1>
          <p className="text-muted-foreground">Manage a list of items using Supabase.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><PlusCircle className="mr-2 h-5 w-5"/>Add New Item</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddItem} className="flex items-end gap-3">
            <div className="flex-grow">
              <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-1">
                Item Name
              </label>
              <Input
                id="itemName"
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Enter item name"
                disabled={isSubmitting}
                className="h-10"
              />
            </div>
            <Button type="submit" disabled={isSubmitting || !itemName.trim()} className="h-10">
              {isSubmitting ? "Adding..." : "Add Item"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Items</CardTitle>
          <CardDescription>List of items from the database.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading items...</p>
          ) : items.length > 0 ? (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between p-3 border rounded-md shadow-sm hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Added on: {format(new Date(item.created_at), "PPP p")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      User ID: {item.user_id || "N/A"}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteItem(item.id)}
                    aria-label={`Delete item ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No items found. Add one above!</p>
          )}
        </CardContent>
      </Card>
       <Card className="mt-6 bg-amber-50 border-amber-200">
        <CardHeader>
            <CardTitle className="text-amber-700">Important Note on Row Level Security (RLS)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-600 space-y-2">
            <p>This example uses basic RLS policies. For a production application, you MUST configure appropriate RLS policies on your <code>items</code> table (and any other tables) in Supabase to ensure data security and proper access control.</p>
            <p>The example policies allow any authenticated user to add items, view all items, and update/delete their own items. Tailor these to your specific needs (e.g., users can only view their own items).</p>
            <p>Find the example SQL for table creation and RLS setup in the Supabase Dashboard &gt; SQL Editor, or in the instructions provided.</p>
        </CardContent>
      </Card>
    </div>
  );
}
