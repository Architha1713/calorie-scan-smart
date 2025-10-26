import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Camera, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface NutritionData {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  healthRating: "good" | "average" | "poor";
  vitamins?: string;
  minerals?: string;
}

const Analyze = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [manualEntry, setManualEntry] = useState({
    foodName: "",
    servingSize: "",
    mealType: "lunch" as "breakfast" | "lunch" | "dinner" | "snack",
    notes: "",
  });
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile && !manualEntry.foodName) {
      toast.error("Please upload an image or enter food name");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let imageUrl = "";

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("meal-images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("meal-images")
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Call AI detection edge function
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke("analyze-food", {
        body: {
          imageUrl: imageUrl || null,
          foodName: manualEntry.foodName || null,
        },
      });

      if (aiError) throw aiError;

      setNutritionData(aiResponse);

      // Save to database
      const { error: insertError } = await supabase.from("meals").insert({
        user_id: user.id,
        food_name: aiResponse.foodName,
        image_url: imageUrl || null,
        calories: aiResponse.calories,
        protein: aiResponse.protein,
        carbs: aiResponse.carbs,
        fat: aiResponse.fat,
        vitamins: aiResponse.vitamins,
        minerals: aiResponse.minerals,
        serving_size: manualEntry.servingSize,
        meal_type: manualEntry.mealType,
        health_rating: aiResponse.healthRating,
        notes: manualEntry.notes,
      });

      if (insertError) throw insertError;

      toast.success("Meal analyzed and saved!");
    } catch (error: any) {
      console.error("Error analyzing food:", error);
      toast.error(error.message || "Failed to analyze food");
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "good": return "text-success";
      case "average": return "text-warning";
      case "poor": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getRatingBg = (rating: string) => {
    switch (rating) {
      case "good": return "bg-success/10";
      case "average": return "bg-warning/10";
      case "poor": return "bg-destructive/10";
      default: return "bg-muted";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-muted">
      <div className="container mx-auto p-6 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Analyze Your Meal
              </CardTitle>
              <CardDescription>Upload a photo or enter details manually</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image">Food Photo (Optional)</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={loading}
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="foodName">Food Name</Label>
                <Input
                  id="foodName"
                  placeholder="e.g., Grilled chicken salad"
                  value={manualEntry.foodName}
                  onChange={(e) => setManualEntry({ ...manualEntry, foodName: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="servingSize">Serving Size</Label>
                <Input
                  id="servingSize"
                  placeholder="e.g., 1 plate, 200g"
                  value={manualEntry.servingSize}
                  onChange={(e) => setManualEntry({ ...manualEntry, servingSize: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mealType">Meal Type</Label>
                <Select
                  value={manualEntry.mealType}
                  onValueChange={(value: any) => setManualEntry({ ...manualEntry, mealType: value })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes..."
                  value={manualEntry.notes}
                  onChange={(e) => setManualEntry({ ...manualEntry, notes: e.target.value })}
                  disabled={loading}
                />
              </div>

              <Button onClick={handleAnalyze} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze with AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle>Nutrition Analysis</CardTitle>
              <CardDescription>
                {nutritionData ? "AI-detected nutrition information" : "Results will appear here"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nutritionData ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{nutritionData.foodName}</h3>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRatingBg(nutritionData.healthRating)} ${getRatingColor(nutritionData.healthRating)}`}>
                      {nutritionData.healthRating.toUpperCase()}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Calories</span>
                        <span className="text-sm font-bold">{nutritionData.calories} cal</span>
                      </div>
                      <Progress value={Math.min((nutritionData.calories / 800) * 100, 100)} />
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{nutritionData.protein}g</p>
                        <p className="text-xs text-muted-foreground mt-1">Protein</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-accent">{nutritionData.carbs}g</p>
                        <p className="text-xs text-muted-foreground mt-1">Carbs</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-warning">{nutritionData.fat}g</p>
                        <p className="text-xs text-muted-foreground mt-1">Fat</p>
                      </div>
                    </div>

                    {nutritionData.vitamins && (
                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium mb-1">Vitamins</p>
                        <p className="text-sm text-muted-foreground">{nutritionData.vitamins}</p>
                      </div>
                    )}

                    {nutritionData.minerals && (
                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium mb-1">Minerals</p>
                        <p className="text-sm text-muted-foreground">{nutritionData.minerals}</p>
                      </div>
                    )}
                  </div>

                  <Button onClick={() => navigate("/dashboard")} className="w-full">
                    View Dashboard
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Upload an image or enter food details to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analyze;
