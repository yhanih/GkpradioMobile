import { useState, useEffect, useCallback } from "react";
import { Search, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { spouseService } from "@/lib/supabase-data";
import { debounce } from "@/lib/utils";

interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string | null;
}

interface UserSearchAutocompleteProps {
  onSelect: (user: User | null) => void;
  placeholder?: string;
  excludeUserId?: string;
  selectedUser?: User | null;
  disabled?: boolean;
  category?: string;
}

const UserSearchAutocomplete = ({ 
  onSelect, 
  placeholder = "Start typing to search...",
  excludeUserId,
  selectedUser,
  disabled = false,
  category
}: UserSearchAutocompleteProps) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced search function
  const searchUsers = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const users = await spouseService.searchUsers(searchQuery, excludeUserId);
        setSuggestions(users || []);
      } catch (error) {
        console.error("Error searching users:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [excludeUserId]
  );

  useEffect(() => {
    searchUsers(query);
  }, [query, searchUsers]);

  const handleSelect = (user: User) => {
    onSelect(user);
    setQuery("");
    setShowSuggestions(false);
  };

  const handleClear = () => {
    onSelect(null);
    setQuery("");
    setSuggestions([]);
  };

  const getPlaceholderText = () => {
    if (category === "To My Husband") {
      return "Tag your husband...";
    } else if (category === "To My Wife") {
      return "Tag your wife...";
    }
    return placeholder;
  };

  if (selectedUser) {
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
        <div className="flex items-center gap-3">
          <Heart className="w-4 h-4 text-red-500" />
          <Avatar className="h-8 w-8">
            {selectedUser.avatar && (
              <AvatarImage src={selectedUser.avatar} alt={selectedUser.displayName} />
            )}
            <AvatarFallback>
              {selectedUser.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{selectedUser.displayName}</p>
            <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
          </div>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Remove
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={getPlaceholderText()}
          className="pl-10"
          disabled={disabled}
          data-testid="input-search-spouse"
        />
      </div>

      {showSuggestions && (query.trim().length >= 2) && (
        <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-sm text-center text-muted-foreground">
              Searching...
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-1">
              {suggestions.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="w-full px-3 py-2 hover:bg-muted flex items-center gap-3 transition-colors"
                  onClick={() => handleSelect(user)}
                  data-testid={`option-user-${user.id}`}
                >
                  <Avatar className="h-8 w-8">
                    {user.avatar && (
                      <AvatarImage src={user.avatar} alt={user.displayName} />
                    )}
                    <AvatarFallback>
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 text-sm text-center text-muted-foreground">
              No users found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearchAutocomplete;