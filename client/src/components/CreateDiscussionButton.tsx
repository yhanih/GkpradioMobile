import { useState, useEffect } from "react";
import { Plus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";
import CreateDiscussionModal from "@/components/CreateDiscussionModal";
import { supabase } from "@/lib/supabase";

const CreateDiscussionButton = () => {
  const { user, loading } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);
    };
    
    if (user) {
      getCurrentUser();
    }
  }, [user]);

  // Don't render anything while loading auth state
  if (loading) {
    return null;
  }

  if (!user) {
    // Logged-out state: Open auth modal when clicked
    return (
      <>
        <Button
          className="bg-gray-100 text-gray-600 hover:bg-gray-200 px-4 py-2 rounded-md flex items-center"
          onClick={() => setIsAuthOpen(true)}
          data-testid="button-login-to-create"
        >
          <LogIn className="w-4 h-4 mr-2" />
          Sign in to create discussion
        </Button>
        <AuthModal 
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onLogin={() => {
            setIsAuthOpen(false);
            // The AuthContext will automatically update the user state
          }}
        />
      </>
    );
  }

  // Logged-in state: Primary button
  return (
    <>
      <Button
        className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center"
        onClick={() => setIsCreateOpen(true)}
        data-testid="button-create-discussion"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create Discussion
      </Button>
      <CreateDiscussionModal 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        currentUserId={currentUserId}
      />
    </>
  );
};

export default CreateDiscussionButton;