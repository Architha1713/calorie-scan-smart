-- Add weight tracking columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN current_weight numeric,
ADD COLUMN target_weight numeric,
ADD COLUMN height numeric;

-- Create a function to calculate recommended daily calories
CREATE OR REPLACE FUNCTION public.calculate_recommended_calories(
  p_current_weight numeric,
  p_target_weight numeric,
  p_weight_goal text,
  p_height numeric DEFAULT 170
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  bmr numeric;
  tdee numeric;
  weight_diff numeric;
  recommended_calories integer;
BEGIN
  -- Simple BMR calculation (Mifflin-St Jeor for average adult)
  -- Using default height of 170cm and age of 30 if not provided
  bmr := (10 * COALESCE(p_current_weight, 70)) + (6.25 * COALESCE(p_height, 170)) - (5 * 30);
  
  -- TDEE (assuming moderate activity level - 1.55 multiplier)
  tdee := bmr * 1.55;
  
  weight_diff := COALESCE(p_target_weight, p_current_weight) - COALESCE(p_current_weight, 70);
  
  -- Calculate recommended calories based on goal
  IF p_weight_goal = 'lose' THEN
    -- Deficit of 500 calories per day (lose ~0.5kg per week)
    recommended_calories := FLOOR(tdee - 500);
  ELSIF p_weight_goal = 'gain' THEN
    -- Surplus of 500 calories per day (gain ~0.5kg per week)
    recommended_calories := FLOOR(tdee + 500);
  ELSE
    -- Maintenance
    recommended_calories := FLOOR(tdee);
  END IF;
  
  -- Ensure minimum of 1200 calories
  IF recommended_calories < 1200 THEN
    recommended_calories := 1200;
  END IF;
  
  RETURN recommended_calories;
END;
$$;