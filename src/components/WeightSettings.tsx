import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Scale } from "lucide-react";

interface WeightSettingsProps {
  userId: string;
  currentWeight?: number | null;
  targetWeight?: number | null;
  height?: number | null;
  onUpdate: () => void;
}

const WeightSettings = ({ userId, currentWeight, targetWeight, height, onUpdate }: WeightSettingsProps) => {
  const [formData, setFormData] = useState({
    currentWeight: currentWeight || "",
    targetWeight: targetWeight || "",
    height: height || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.currentWeight || !formData.targetWeight) {
      toast.error("Please enter both current and target weight");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          current_weight: Number(formData.currentWeight),
          target_weight: Number(formData.targetWeight),
          height: formData.height ? Number(formData.height) : null,
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Weight data saved successfully!");
      onUpdate();
    } catch (error) {
      console.error("Error saving weight data:", error);
      toast.error("Failed to save weight data");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />
          Weight Tracking
        </CardTitle>
        <CardDescription>Set your weight goals for personalized recommendations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currentWeight">Current Weight (kg)</Label>
            <Input
              id="currentWeight"
              type="number"
              step="0.1"
              placeholder="70"
              value={formData.currentWeight}
              onChange={(e) => setFormData({ ...formData, currentWeight: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetWeight">Target Weight (kg)</Label>
            <Input
              id="targetWeight"
              type="number"
              step="0.1"
              placeholder="65"
              value={formData.targetWeight}
              onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Height (cm) - Optional</Label>
            <Input
              id="height"
              type="number"
              placeholder="170"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
            />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Weight Data"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default WeightSettings;
