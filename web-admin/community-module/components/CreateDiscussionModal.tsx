import { useState } from "react";
import { Loader2, Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCreateThread } from "../hooks/useCommunity";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import UserSearchAutocomplete from "./UserSearchAutocomplete";

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

interface CreateDiscussionModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserId?: string;
}

const CreateDiscussionModal = ({ isOpen, onClose, currentUserId }: CreateDiscussionModalProps) => {
    const { toast } = useToast();
    const [taggedSpouse, setTaggedSpouse] = useState<any>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [renderAt] = useState<number>(Date.now());

    const form = useForm<CreateDiscussionForm>({
        resolver: zodResolver(createDiscussionSchema),
        defaultValues: {
            title: "",
            category: "",
            content: "",
        },
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
                    toast({
                        title: "Discussion Created",
                        description: "Your discussion has been posted successfully!",
                    });
                    form.reset();
                    setTaggedSpouse(null);
                    setSelectedCategory("");
                    onClose();
                },
                onError: (error) => {
                    toast({
                        title: "Failed to Create Discussion",
                        description: error instanceof Error ? error.message : "Please try again later.",
                        variant: "destructive",
                    });
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

    const handleClose = () => {
        if (!createDiscussionMutation.isPending) {
            form.reset();
            setTaggedSpouse(null);
            setSelectedCategory("");
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Start a New Discussion</DialogTitle>
                    <DialogDescription>
                        Share your thoughts, prayer requests, or testimonies with the community.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="What would you like to discuss?"
                                            {...field}
                                            data-testid="input-discussion-title"
                                        />
                                    </FormControl>
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
                                            if (value !== "To My Husband" && value !== "To My Wife") {
                                                setTaggedSpouse(null);
                                            }
                                        }}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger data-testid="select-discussion-category">
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.name} value={cat.name} data-testid={`option-category-${cat.name}`}>
                                                    {cat.icon} {cat.name}
                                                </SelectItem>
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
                                    excludeUserId={currentUserId}
                                    category={selectedCategory}
                                    placeholder={`Search for your ${selectedCategory === "To My Husband" ? "husband" : "wife"}...`}
                                />
                                <FormDescription>
                                    Tag your spouse to send them a special notification about this message
                                </FormDescription>
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Content</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Share your thoughts, experiences, or questions..."
                                            className="min-h-[200px]"
                                            {...field}
                                            data-testid="textarea-discussion-content"
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Be respectful and encouraging in your discussions.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={createDiscussionMutation.isPending}
                                data-testid="button-cancel"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createDiscussionMutation.isPending}
                                data-testid="button-submit-discussion"
                            >
                                {createDiscussionMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Posting...
                                    </>
                                ) : (
                                    "Post Discussion"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateDiscussionModal;
