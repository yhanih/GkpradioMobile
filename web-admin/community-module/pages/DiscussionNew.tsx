import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Module internal imports
import UserSearchAutocomplete from "../components/UserSearchAutocomplete";
import { useCreateThread } from "../hooks/useCommunity";

// External common components
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

const createDiscussionSchema = z.object({
    title: z.string()
        .min(5, "Title must be at least 5 characters")
        .max(150, "Title must be less than 150 characters"),
    category: z.string()
        .min(1, "Please select a category"),
    content: z.string()
        .min(10, "Content must be at least 10 characters")
        .max(5000, "Content must be less than 5000 characters"),
});

type CreateDiscussionForm = z.infer<typeof createDiscussionSchema>;

const DiscussionNew = () => {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [taggedSpouse, setTaggedSpouse] = useState<any>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [renderAt] = useState<number>(Date.now());

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast({ title: "Authentication Required", description: "Please log in to create a discussion.", variant: "destructive" });
                setLocation("/login");
                return;
            }
            setCurrentUser(user);
        };
        checkUser();
    }, [setLocation, toast]);

    const form = useForm<CreateDiscussionForm>({
        resolver: zodResolver(createDiscussionSchema),
        defaultValues: { title: "", category: "", content: "" },
    });

    const createDiscussionMutation = useCreateThread();

    const onSubmit = (data: CreateDiscussionForm) => {
        createDiscussionMutation.mutate(
            {
                title: data.title,
                content: data.content,
                category: data.category,
                tags: [],
                taggedSpouseId: taggedSpouse?.id || null,
                renderAt: renderAt,
                hp: "",
            },
            {
                onSuccess: () => {
                    toast({ title: "Discussion Created", description: "Your discussion has been posted successfully!" });
                    setLocation("/community");
                },
                onError: (error) => {
                    toast({ title: "Failed to Create Discussion", description: error instanceof Error ? error.message : "Please try again later.", variant: "destructive" });
                }
            }
        );
    };

    const categories = [
        { name: "Prayer Requests", icon: "🙏" },
        { name: "Testimonies", icon: "✨" },
        { name: "Pray for Others", icon: "❤️" },
        { name: "Youth Voices", icon: "🎓" },
        { name: "Praise & Worship", icon: "🎵" },
        { name: "To My Husband", icon: "💙" },
        { name: "To My Wife", icon: "💖" },
        { name: "Words of Encouragement", icon: "💪" },
        { name: "Born Again", icon: "✝️" },
        { name: "Bragging on My Child (ren)", icon: "👶" },
        { name: "Sharing Hobbies", icon: "🎨" },
        { name: "Money & Finances", icon: "💰" },
        { name: "Physical & Mental Health", icon: "🏥" },
    ];

    if (!currentUser) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <Header />
            <main className="pt-24 pb-12">
                <div className="container mx-auto px-4 max-w-2xl">
                    <Button variant="ghost" className="mb-6" onClick={() => setLocation("/community")}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Community
                    </Button>

                    <Card>
                        <CardHeader>
                            <CardTitle>Start a New Discussion</CardTitle>
                            <CardDescription>Share your thoughts, prayer requests, or testimonies with the community.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Title</FormLabel>
                                                <FormControl><Input placeholder="What would you like to discuss?" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="category"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Category</FormLabel>
                                                <Select
                                                    onValueChange={(value) => {
                                                        field.onChange(value);
                                                        setSelectedCategory(value);
                                                        if (value !== "To My Husband" && value !== "To My Wife") setTaggedSpouse(null);
                                                    }}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {categories.map((cat) => (
                                                            <SelectItem key={cat.name} value={cat.name}>{cat.icon} {cat.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {(selectedCategory === "To My Husband" || selectedCategory === "To My Wife") && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-center gap-2">
                                                <Heart className="w-4 h-4 text-red-500" />
                                                <FormLabel>Tag Your {selectedCategory === "To My Husband" ? "Husband" : "Wife"} (Optional)</FormLabel>
                                            </div>
                                            <UserSearchAutocomplete
                                                onSelect={setTaggedSpouse}
                                                selectedUser={taggedSpouse}
                                                excludeUserId={currentUser?.id}
                                                category={selectedCategory}
                                                placeholder={`Search for your ${selectedCategory === "To My Husband" ? "husband" : "wife"}...`}
                                            />
                                        </div>
                                    )}

                                    <FormField
                                        control={form.control}
                                        name="content"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Content</FormLabel>
                                                <FormControl><Textarea placeholder="Share your thoughts, experiences, or questions..." className="min-h-[200px]" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex justify-end gap-3">
                                        <Button type="button" variant="outline" onClick={() => setLocation("/community")}>Cancel</Button>
                                        <Button type="submit" disabled={createDiscussionMutation.isPending}>
                                            {createDiscussionMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Posting...</> : "Post Discussion"}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default DiscussionNew;
