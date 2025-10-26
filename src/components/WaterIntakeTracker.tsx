import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Droplets, Plus, Minus } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface WaterIntakeTrackerProps {
  userId: string;
  currentIntake: number;
  dailyGoal: number;
  onUpdate: () => void;
}

const WaterIntakeTracker = ({ userId, currentIntake, dailyGoal, onUpdate }: WaterIntakeTrackerProps) => {
  const [customAmount, setCustomAmount] = useState("");
  const [updating, setUpdating] = useState(false);

  const updateWaterIntake = async (newAmount: number) => {
    setUpdating(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if record exists for today
      const { data: existing } = await supabase
        .from("water_intake")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from("water_intake")
          .update({ amount: newAmount })
          .eq("id", existing.id);
        
        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from("water_intake")
          .insert({ user_id: userId, date: today, amount: newAmount });
        
        if (error) throw error;
      }

      toast.success("Water intake updated!");
      onUpdate();
    } catch (error) {
      console.error("Error updating water intake:", error);
      toast.error("Failed to update water intake");
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickAdd = (amount: number) => {
    updateWaterIntake(currentIntake + amount);
  };

  const handleCustomAdd = () => {
    const amount = Number(customAmount);
    if (amount > 0) {
      updateWaterIntake(currentIntake + amount);
      setCustomAmount("");
    }
  };

  const waterProgress = (currentIntake / dailyGoal) * 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-500" />
          Water Intake
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">{currentIntake} ml</span>
              <span className="text-muted-foreground">of {dailyGoal} ml</span>
            </div>
            <Progress value={waterProgress} className="h-2" />
          </div>
          <p className="text-xs text-muted-foreground">
            {dailyGoal - currentIntake > 0
              ? `${dailyGoal - currentIntake} ml to go`
              : "Well hydrated!"}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Quick Add</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickAdd(250)}
              disabled={updating}
            >
              <Plus className="w-4 h-4 mr-1" />
              250ml
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickAdd(500)}
              disabled={updating}
            >
              <Plus className="w-4 h-4 mr-1" />
              500ml
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickAdd(-250)}
              disabled={updating || currentIntake < 250}
            >
              <Minus className="w-4 h-4 mr-1" />
              250ml
            </Button>
          </div>

          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Custom amount (ml)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              disabled={updating}
            />
            <Button onClick={handleCustomAdd} disabled={updating || !customAmount}>
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WaterIntakeTracker;
