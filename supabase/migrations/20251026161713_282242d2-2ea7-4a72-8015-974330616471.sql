-- Fix search_path for existing functions to address security warnings

-- Recreate handle_new_user with search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, daily_calorie_goal, daily_water_goal, weight_goal)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    2000,
    2000,
    'maintain'
  );
  RETURN new;
END;
$$;

-- Recreate update_updated_at_column with search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate calculate_recommended_calories with search_path (it was already created with it, but redeclaring to be sure)
CREATE OR REPLACE FUNCTION public.calculate_recommended_calories(
  p_current_weight numeric,
  p_target_weight numeric,
  p_weight_goal text,
  p_height numeric DEFAULT 170
)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  bmr numeric;
  tdee numeric;
  recommended_calories integer;
BEGIN
  -- Simple BMR calculation (Mifflin-St Jeor for average adult)
  bmr := (10 * COALESCE(p_current_weight, 70)) + (6.25 * COALESCE(p_height, 170)) - (5 * 30);
  
  -- TDEE (assuming moderate activity level - 1.55 multiplier)
  tdee := bmr * 1.55;
  
  -- Calculate recommended calories based on goal
  IF p_weight_goal = 'lose' THEN
    recommended_calories := FLOOR(tdee - 500);
  ELSIF p_weight_goal = 'gain' THEN
    recommended_calories := FLOOR(tdee + 500);
  ELSE
    recommended_calories := FLOOR(tdee);
  END IF;
  
  -- Ensure minimum of 1200 calories
  IF recommended_calories < 1200 THEN
    recommended_calories := 1200;
  END IF;
  
  RETURN recommended_calories;
END;
$$;