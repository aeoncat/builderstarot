"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { guestStore } from "@/lib/guestStore";

export default function SettingsPage() {
  const [allowReversedDefault, setAllowReversedDefault] = useState(true);
  const [reversedChance, setReversedChance] = useState(30);

  useEffect(() => {
    const settings = guestStore.getSettings();
    setReversedChance(settings.defaultReversedChance);
    setAllowReversedDefault(settings.defaultReversedChance > 0);
  }, []);

  function saveSettings() {
    guestStore.setSettings({
      defaultReversedChance: allowReversedDefault ? reversedChance : 0,
    });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Settings</h1>
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Enable reversed cards by default</span>
          <Switch checked={allowReversedDefault} onCheckedChange={setAllowReversedDefault} />
        </div>
        <div className="space-y-1">
          <label htmlFor="default-reversed" className="text-sm font-medium">
            Default reversed chance: {allowReversedDefault ? reversedChance : 0}%
          </label>
          <input
            id="default-reversed"
            type="range"
            min={0}
            max={100}
            value={reversedChance}
            onChange={(event) => setReversedChance(Number(event.target.value))}
            disabled={!allowReversedDefault}
            className="w-full"
          />
        </div>
        <Button onClick={saveSettings}>Save</Button>
      </Card>
    </div>
  );
}
