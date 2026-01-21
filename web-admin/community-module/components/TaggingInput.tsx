import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, AtSign, Mail, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface Tag {
    id: string;
    type: 'user' | 'email';
    userId?: number | string;
    username?: string;
    displayName?: string;
    email?: string;
    category?: string;
}

interface TaggingInputProps {
    tags: Tag[];
    onTagsChange: (tags: Tag[]) => void;
    className?: string;
}

interface SearchUser {
    id: number | string;
    username: string;
    displayName: string;
    avatar?: string;
    city?: string;
    country?: string;
}

const tagCategories = [
    { value: 'husband', label: '💙 To My Husband' },
    { value: 'wife', label: '💖 To My Wife' },
    { value: 'friend', label: '👥 Friend' },
    { value: 'family', label: '👨‍👩‍👧‍👦 Family' },
    { value: 'mentor', label: '🧑‍🏫 Mentor' },
    { value: 'prayer_partner', label: '🙏 Prayer Partner' },
];

export function TaggingInput({ tags, onTagsChange, className = "" }: TaggingInputProps) {
    const [inputValue, setInputValue] = useState("");
    const [emailInput, setEmailInput] = useState("");
    const [showEmailInput, setShowEmailInput] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>();
    const inputRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);

    const searchQuery = inputValue.startsWith('@') && inputValue.length >= 3
        ? encodeURIComponent(inputValue.replace('@', ''))
        : '';

    // Note: This expects a specific user search API.
    const { data: searchResults = [], isLoading } = useQuery<SearchUser[]>({
        queryKey: [`/api/users/search?q=${searchQuery}`],
        enabled: !!searchQuery,
    });

    useEffect(() => {
        setShowSuggestions(inputValue.startsWith('@') && inputValue.length >= 3 && Array.isArray(searchResults) && searchResults.length > 0);
    }, [inputValue, searchResults]);

    const addUserTag = (user: SearchUser) => {
        const newTag: Tag = {
            id: `user-${user.id}-${Date.now()}`,
            type: 'user',
            userId: user.id,
            username: user.username,
            displayName: user.displayName,
            category: selectedCategory,
        };

        onTagsChange([...tags, newTag]);
        setInputValue("");
        setShowSuggestions(false);
        setSelectedCategory(undefined);
    };

    const addEmailTag = () => {
        if (!emailInput.trim() || !isValidEmail(emailInput)) return;

        const newTag: Tag = {
            id: `email-${emailInput}-${Date.now()}`,
            type: 'email',
            email: emailInput.trim(),
            category: selectedCategory,
        };

        onTagsChange([...tags, newTag]);
        setEmailInput("");
        setShowEmailInput(false);
        setSelectedCategory(undefined);
    };

    const removeTag = (tagId: string) => {
        onTagsChange(tags.filter(tag => tag.id !== tagId));
    };

    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setShowSuggestions(false);
            setInputValue("");
        }
    };

    const handleEmailKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && emailInput.trim() && isValidEmail(emailInput)) {
            e.preventDefault();
            addEmailTag();
        }
        if (e.key === 'Escape') {
            setShowEmailInput(false);
            setEmailInput("");
        }
    };

    return (
        <div className={`space-y-4 ${className}`}>
            <div>
                <label className="block text-sm font-medium mb-2">Tag Users</label>
                <p className="text-xs text-muted-foreground mb-3">
                    Tag community members to notify them about this discussion
                </p>

                <div className="mb-3">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full" data-testid="select-tag-category">
                            <SelectValue placeholder="Select relationship (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                            {tagCategories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                    {category.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="relative mb-3">
                    <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="@username to tag a member..."
                            className="pl-10"
                            data-testid="input-tag-username"
                        />
                    </div>

                    {showSuggestions && (
                        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
                            <CardContent className="p-2">
                                {isLoading ? (
                                    <div className="p-2 text-center text-sm text-muted-foreground">Searching...</div>
                                ) : (
                                    <div className="space-y-1">
                                        {searchResults.map((user: SearchUser) => (
                                            <Button
                                                key={user.id}
                                                variant="ghost"
                                                className="w-full justify-start h-auto p-2"
                                                onClick={() => addUserTag(user)}
                                                data-testid={`suggestion-user-${user.username}`}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                                                        <UserIcon className="w-4 h-4" />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="font-medium text-sm">@{user.username}</div>
                                                        <div className="text-xs text-muted-foreground">{user.displayName}</div>
                                                    </div>
                                                </div>
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="flex gap-2 mb-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEmailInput(!showEmailInput)}
                        data-testid="button-toggle-email-input"
                    >
                        <Mail className="w-4 h-4 mr-2" />
                        {showEmailInput ? 'Cancel Email Tag' : 'Tag by Email'}
                    </Button>
                </div>

                {showEmailInput && (
                    <div className="flex gap-2 mb-3">
                        <div className="flex-1 relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                ref={emailRef}
                                type="email"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                onKeyDown={handleEmailKeyDown}
                                placeholder="email@example.com"
                                className="pl-10"
                                data-testid="input-tag-email"
                            />
                        </div>
                        <Button
                            type="button"
                            onClick={addEmailTag}
                            disabled={!emailInput.trim() || !isValidEmail(emailInput)}
                            size="sm"
                            data-testid="button-add-email-tag"
                        >
                            Add
                        </Button>
                    </div>
                )}

                {tags.length > 0 && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tagged Users:</label>
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                                <Badge
                                    key={tag.id}
                                    variant="secondary"
                                    className="flex items-center gap-1 px-3 py-1"
                                    data-testid={`tag-chip-${tag.id}`}
                                >
                                    {tag.type === 'user' ? (
                                        <>
                                            <AtSign className="w-3 h-3" />
                                            <span>{tag.username}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="w-3 h-3" />
                                            <span>{tag.email}</span>
                                        </>
                                    )}
                                    {tag.category && (
                                        <span className="text-xs opacity-75">
                                            ({tagCategories.find(c => c.value === tag.category)?.label?.replace(/\s.*/, '') || tag.category})
                                        </span>
                                    )}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-0 ml-1"
                                        onClick={() => removeTag(tag.id)}
                                        data-testid={`button-remove-tag-${tag.id}`}
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
