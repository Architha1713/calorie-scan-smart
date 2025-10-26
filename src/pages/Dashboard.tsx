import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Droplets, Target, TrendingUp, LogOut, Upload, Zap } from "lucide-react";
import { toast } from "sonner";
import WeightSettings from "@/components/WeightSettings";
import WaterIntakeTracker from "@/components/WaterIntakeTracker";

interface Profile {
  id: string;
  username: string;
  daily_calorie_goal: number;
  daily_water_goal: number;
  weight_goal: string;
  current_weight?: number | null;
  target_weight?: number | null;
  height?: number | null;
}

interface MealSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [waterIntake, setWaterIntake] = useState(0);
  const [mealSummary, setMealSummary] = useState<MealSummary>({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recommendedCalories, setRecommendedCalories] = useState<number | null>(null);

  useEffect(() => {
    checkAuth();
    fetchDashboardData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (profileData) setProfile(profileData);

      // Fetch today's meals
      const today = new Date().toISOString().split('T')[0];
      const { data: meals } = await supabase
        .from("meals")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`);

      if (meals) {
        const summary = meals.reduce((acc, meal) => ({
          totalCalories: acc.totalCalories + (meal.calories || 0),
          totalProtein: acc.totalProtein + (Number(meal.protein) || 0),
          totalCarbs: acc.totalCarbs + (Number(meal.carbs) || 0),
          totalFat: acc.totalFat + (Number(meal.fat) || 0),
        }), { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 });
        
        setMealSummary(summary);
      }

      // Fetch today's water intake
      const { data: waterData } = await supabase
        .from("water_intake")
        .select("amount")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();

      if (waterData) setWaterIntake(waterData.amount);

      // Calculate recommended calories if weight data is available
      if (profileData?.current_weight && profileData?.target_weight) {
        const { data: calorieData, error: calorieError } = await supabase
          .rpc('calculate_recommended_calories', {
            p_current_weight: profileData.current_weight,
            p_target_weight: profileData.target_weight,
            p_weight_goal: profileData.weight_goal,
            p_height: profileData.height || 170
          });

        if (!calorieError && calorieData) {
          setRecommendedCalories(calorieData);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const calorieProgress = profile ? (mealSummary.totalCalories / profile.daily_calorie_goal) * 100 : 0;
  const waterProgress = profile ? (waterIntake / profile.daily_water_goal) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-muted">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {profile?.username}! 👋</h1>
            <p className="text-muted-foreground mt-1">Eat smart, stay fit.</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>

        {/* Quick Action */}
        <Card className="mb-8 bg-gradient-to-r from-primary to-primary-light text-primary-foreground border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">Track Your Meal</h3>
                <p className="opacity-90">Upload a photo or enter food details manually</p>
              </div>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate("/analyze")}
              >
                <Upload className="w-5 h-5 mr-2" />
                Add Meal
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Weight Settings */}
        <WeightSettings
          userId={profile?.id || ""}
          currentWeight={profile?.current_weight}
          targetWeight={profile?.target_weight}
          height={profile?.height}
          onUpdate={fetchDashboardData}
        />

        {/* Personalized Calorie Advice */}
        {recommendedCalories && profile?.current_weight && profile?.target_weight && (
          <Card className="mb-8 bg-gradient-to-r from-accent to-accent-light border-0">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-background/20 rounded-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">Your Weekly Calorie Plan</h3>
                  <div className="space-y-2 text-white/90">
                    <p>Current Weight: <span className="font-semibold">{profile.current_weight} kg</span></p>
                    <p>Target Weight: <span className="font-semibold">{profile.target_weight} kg</span></p>
                    <p>Recommended Daily Calories: <span className="font-semibold">{recommendedCalories} cal</span></p>
                    <p className="text-sm mt-3 bg-white/10 p-3 rounded-lg">
                      {profile.weight_goal === 'lose' && 
                        `To lose weight healthily, aim for ${recommendedCalories} calories per day. This creates a 500-calorie deficit, helping you lose about 0.5kg per week.`
                      }
                      {profile.weight_goal === 'gain' && 
                        `To gain weight healthily, aim for ${recommendedCalories} calories per day. This creates a 500-calorie surplus, helping you gain about 0.5kg per week.`
                      }
                      {profile.weight_goal === 'maintain' && 
                        `To maintain your weight, aim for ${recommendedCalories} calories per day, matching your daily energy expenditure.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Calorie Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Daily Calories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">{mealSummary.totalCalories} cal</span>
                    <span className="text-muted-foreground">of {profile?.daily_calorie_goal}</span>
                  </div>
                  <Progress value={calorieProgress} className="h-2" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {profile && profile.daily_calorie_goal - mealSummary.totalCalories > 0
                    ? `${profile.daily_calorie_goal - mealSummary.totalCalories} cal remaining`
                    : "Goal reached!"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Water Card with Tracker */}
          <WaterIntakeTracker
            userId={profile?.id || ""}
            currentIntake={waterIntake}
            dailyGoal={profile?.daily_water_goal || 2000}
            onUpdate={fetchDashboardData}
          />

          {/* Goal Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                Weight Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold capitalize">{profile?.weight_goal}</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.weight_goal === "gain" && "Building muscle and strength"}
                  {profile?.weight_goal === "lose" && "Losing weight healthily"}
                  {profile?.weight_goal === "maintain" && "Maintaining healthy weight"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Nutrition Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Nutrition</CardTitle>
            <CardDescription>Macronutrient breakdown from today's meals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{mealSummary.totalProtein.toFixed(1)}g</p>
                <p className="text-sm text-muted-foreground mt-1">Protein</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-accent">{mealSummary.totalCarbs.toFixed(1)}g</p>
                <p className="text-sm text-muted-foreground mt-1">Carbs</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-warning">{mealSummary.totalFat.toFixed(1)}g</p>
                <p className="text-sm text-muted-foreground mt-1">Fat</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
