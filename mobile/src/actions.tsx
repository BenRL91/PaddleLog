import React from "react";
import { Button, Screen, Sheet } from "./ui";
export type MenuAction = { label: string; run: () => void; danger?: boolean };
// Android Alert supports at most three actions; use the same native sheet on both OSes.
export function ActionMenu({
  title,
  actions,
  onClose,
}: {
  title: string;
  actions: MenuAction[];
  onClose: () => void;
}) {
  return (
    <Sheet title={title} onClose={onClose}>
      <Screen>
        {actions.map((action) => (
          <Button
            key={action.label}
            title={action.label}
            danger={action.danger}
            onPress={() => {
              onClose();
              action.run();
            }}
          />
        ))}
      </Screen>
    </Sheet>
  );
}
