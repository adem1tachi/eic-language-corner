-- تأكد من وجود نوع الرتب
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('member', 'organizer', 'admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- تحديث الدالة لتكون أكثر أماناً
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'member'
  );
  RETURN new;
END;
$$;

-- إعادة ربط الـ Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
