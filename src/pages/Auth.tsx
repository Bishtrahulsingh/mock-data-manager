import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Database, Code2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">

        <div className="space-y-6 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Database className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold gradient-text">Mock Data Manager</h1>
          </div>
          
          <div className="space-y-4">
            <p className="text-xl text-muted-foreground">
              Your AI-powered JSONPlaceholder alternative
            </p>
            
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <Code2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-foreground font-medium">Define Custom Schemas</p>
                  <p>Specify your JSON structure with any fields you need</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-foreground font-medium">AI-Generated Mock Data</p>
                  <p>LangChain generates realistic data matching your schema</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Code2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-foreground font-medium">Full CRUD API</p>
                  <p>Get instant REST endpoints for all operations</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="bg-card border border-border rounded-lg p-8 shadow-2xl">
            <SupabaseAuth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: 'hsl(262 83% 58%)',
                      brandAccent: 'hsl(188 85% 51%)',
                      brandButtonText: 'white',
                      defaultButtonBackground: 'hsl(221 23% 16%)',
                      defaultButtonBackgroundHover: 'hsl(221 23% 20%)',
                      defaultButtonBorder: 'hsl(221 23% 16%)',
                      defaultButtonText: 'hsl(213 31% 91%)',
                      dividerBackground: 'hsl(221 23% 16%)',
                      inputBackground: 'hsl(221 23% 11%)',
                      inputBorder: 'hsl(221 23% 16%)',
                      inputBorderHover: 'hsl(262 83% 58%)',
                      inputBorderFocus: 'hsl(262 83% 58%)',
                      inputText: 'hsl(213 31% 91%)',
                      inputLabelText: 'hsl(213 31% 91%)',
                      inputPlaceholder: 'hsl(213 13% 54%)',
                      messageText: 'hsl(213 31% 91%)',
                      messageTextDanger: 'hsl(0 84% 60%)',
                      anchorTextColor: 'hsl(262 83% 58%)',
                      anchorTextHoverColor: 'hsl(188 85% 51%)',
                    },
                    space: {
                      inputPadding: '12px',
                      buttonPadding: '12px',
                    },
                    borderWidths: {
                      buttonBorderWidth: '1px',
                      inputBorderWidth: '1px',
                    },
                    radii: {
                      borderRadiusButton: '0.5rem',
                      buttonBorderRadius: '0.5rem',
                      inputBorderRadius: '0.5rem',
                    },
                  },
                },
                className: {
                  container: 'space-y-4',
                  button: 'font-medium',
                  input: 'font-mono',
                },
              }}
              providers={[]}
              redirectTo={`${window.location.origin}/dashboard`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;