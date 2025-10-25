CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  schema_definition JSONB NOT NULL,
  api_endpoint TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.schemas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own schemas"
  ON public.schemas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own schemas"
  ON public.schemas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schemas"
  ON public.schemas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schemas"
  ON public.schemas FOR DELETE
  USING (auth.uid() = user_id);

CREATE TABLE public.generated_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id UUID NOT NULL REFERENCES public.schemas(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.generated_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view data for their schemas"
  ON public.generated_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.schemas
      WHERE schemas.id = generated_data.schema_id
      AND schemas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create data for their schemas"
  ON public.generated_data FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.schemas
      WHERE schemas.id = generated_data.schema_id
      AND schemas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update data for their schemas"
  ON public.generated_data FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.schemas
      WHERE schemas.id = generated_data.schema_id
      AND schemas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete data for their schemas"
  ON public.generated_data FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.schemas
      WHERE schemas.id = generated_data.schema_id
      AND schemas.user_id = auth.uid()
    )
  );

CREATE INDEX idx_schemas_user_id ON public.schemas(user_id);
CREATE INDEX idx_schemas_api_endpoint ON public.schemas(api_endpoint);
CREATE INDEX idx_generated_data_schema_id ON public.generated_data(schema_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_schemas_updated_at
  BEFORE UPDATE ON public.schemas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_generated_data_updated_at
  BEFORE UPDATE ON public.generated_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();