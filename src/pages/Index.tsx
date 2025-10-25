import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Database, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background">
      <div className="text-center space-y-6 p-8">
        <div className="flex items-center gap-3 justify-center">
          <Database className="w-16 h-16 text-primary" />
          <h1 className="text-5xl font-bold gradient-text">Mock Data Manager</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl">
          AI-powered mock data generation with instant REST APIs
        </p>
        <Button onClick={() => navigate("/auth")} size="lg" className="gap-2">
          Get Started <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Index;
