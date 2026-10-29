import React, { useState } from "react";
import { Alert, View } from "react-native";
import { useLibrary } from "./LibraryProvider";
import { Button, Card, Chips, Field, Label, Row, Screen, Sheet } from "./ui";
import { ProGate } from "./components";
import {
  expenseKinds,
  equipmentKinds,
  usedUnits,
  supplyUnit,
  roundMoney,
  collectionCostSummary,
} from "./domain";
import { useFormDraft } from "./useFormDraft";
import type { Expense } from "./types";
export function Costs({ onAdd }: { onAdd: () => void }) {
  const { snapshot, mutate } = useLibrary();
  const [tab, setTab] = useState("expenses"),
    [editing, setEditing] = useState<Expense>();
  const s = snapshot!.state,
    expenses = s.settings.collectionExpenses ?? [];
  return (
    <>
      <View style={{ padding: 18, gap: 12 }}>
        <Row>
          <View style={{ flex: 1 }}>
            <Label big>Costs</Label>
          </View>
          <Button title="＋ Expense" onPress={onAdd} />
        </Row>
        <Chips
          value={tab}
          onChange={setTab}
          items={[
            { id: "expenses", label: "Expenses" },
            { id: "supplies", label: "Supplies" },
            { id: "insights", label: "Cost insights · PRO" },
          ]}
        />
      </View>
      {tab === "insights" ? (
        <ProGate>
          <Screen>
            {collectionCostSummary(s.paddles, s.sessions, expenses).rows.map(
              (r) => (
                <Card key={r.currency}>
                  <Label big>
                    {r.currency} {r.total.toFixed(2)}
                  </Label>
                  <Label>
                    {r.perHour === null
                      ? "No play recorded"
                      : r.currency + " " + r.perHour.toFixed(2) + " / hour"}
                  </Label>
                  <Label muted>
                    Includes paddle purchases, supplies and general pickleball
                    costs. Currencies remain separate.
                  </Label>
                </Card>
              ),
            )}
          </Screen>
        </ProGate>
      ) : (
        <Screen>
          {tab === "expenses" && (
            <Card>
              {[...new Set(expenses.map((e) => e.currency))].map((currency) => (
                <Label key={currency}>
                  {currency}{" "}
                  {roundMoney(
                    expenses
                      .filter((e) => e.currency === currency)
                      .reduce((n, e) => n + e.amount, 0),
                  ).toFixed(2)}{" "}
                  total collection expenses
                </Label>
              ))}
            </Card>
          )}
          {[...expenses]
            .reverse()
            .filter((e) => tab !== "supplies" || e.quantity)
            .map((e) => (
              <Card key={e.id}>
                <Row>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Label big>
                      {e.product ||
                        expenseKinds[e.kind as keyof typeof expenseKinds]}
                    </Label>
                    <Label muted>
                      {expenseKinds[e.kind as keyof typeof expenseKinds]} ·{" "}
                      {e.date}
                    </Label>
                    <Label>
                      {e.currency} {e.amount.toFixed(2)}
                    </Label>
                    {e.quantity && (
                      <Label>
                        {roundMoney(e.quantity - usedUnits(s, e.id))} /{" "}
                        {e.quantity} {supplyUnit(e.kind)}s remaining ·{" "}
                        {e.currency}{" "}
                        {roundMoney(e.amount / e.quantity).toFixed(2)} /{" "}
                        {supplyUnit(e.kind)}
                      </Label>
                    )}
                  </View>
                  <Button
                    title="⋮"
                    onPress={() =>
                      Alert.alert("Expense actions", e.product, [
                        { text: "Edit", onPress: () => setEditing(e) },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: () =>
                            Alert.alert(
                              "Delete expense?",
                              "Allocated supply packs cannot be deleted until their allocations are removed.",
                              [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Delete",
                                  style: "destructive",
                                  onPress: () => {
                                    if (
                                      s.paddles.some((p) =>
                                        p.expenses?.some(
                                          (cost) => cost.supplyId === e.id,
                                        ),
                                      )
                                    ) {
                                      Alert.alert(
                                        "Supply is in use",
                                        "Remove or correct its maintenance allocations first.",
                                      );
                                      return;
                                    }
                                    void mutate((s) => ({
                                      ...s,
                                      settings: {
                                        ...s.settings,
                                        collectionExpenses:
                                          s.settings.collectionExpenses?.filter(
                                            (x) => x.id !== e.id,
                                          ),
                                      },
                                    })).catch((err) =>
                                      Alert.alert("Delete failed", err.message),
                                    );
                                  },
                                },
                              ],
                            ),
                        },
                        { text: "Cancel", style: "cancel" },
                      ])
                    }
                  />
                </Row>
                {tab === "supplies" && e.quantity && (
                  <Button
                    title="Adjust quantity remaining"
                    onPress={() => setEditing(e)}
                  />
                )}
              </Card>
            ))}
          {!expenses.length && (
            <Card>
              <Label>
                Add a pickleball expense or a supply pack with the plus button.
              </Label>
            </Card>
          )}
        </Screen>
      )}
      {editing && (
        <ExpenseEditor
          expense={editing}
          onClose={() => setEditing(undefined)}
        />
      )}
    </>
  );
}
export function ExpenseEditor({
  expense,
  onClose,
}: {
  expense?: Expense;
  onClose: () => void;
}) {
  const { snapshot, mutate, busy, id } = useLibrary();
  const [recordId, setRecordId] = useState(() => expense?.id ?? id()),
    [product, setProduct] = useState(expense?.product ?? ""),
    [amount, setAmount] = useState(expense ? expense.amount.toFixed(2) : ""),
    [kind, setKind] = useState(expense?.kind ?? "overgrip"),
    [currency, setCurrency] = useState(expense?.currency ?? "USD"),
    [quantity, setQuantity] = useState(
      expense?.quantity ? String(expense.quantity) : "",
    ),
    [remaining, setRemaining] = useState(
      expense?.quantity
        ? String(expense.quantity - usedUnits(snapshot!.state, expense.id))
        : "",
    ),
    [error, setError] = useState("");
  const used = expense?.quantity
    ? usedUnits(snapshot!.state, expense.id) - (expense.outsideUseUnits ?? 0)
    : 0;
  const draft = useFormDraft(
    "expense-" + (expense?.id ?? "new"),
    { recordId, product, amount, kind, currency, quantity, remaining },
    (v) => {
      setRecordId(v.recordId);
      setProduct(v.product);
      setAmount(v.amount);
      setKind(v.kind);
      setCurrency(v.currency);
      setQuantity(v.quantity);
      setRemaining(v.remaining);
    },
  );
  async function save() {
    try {
      const cost = Number(amount);
      if (!amount.trim() || !Number.isFinite(cost) || cost < 0)
        throw Error("Enter a valid amount.");
      const count = Number(quantity);
      if (
        expense &&
        snapshot!.state.paddles.some((p) =>
          p.expenses?.some((e) => e.supplyId === expense.id),
        ) &&
        (roundMoney(cost) !== expense.amount ||
          kind !== expense.kind ||
          currency !== expense.currency ||
          Number(quantity) !== expense.quantity)
      )
        throw Error(
          "This pack has paddle allocations. Adjust remaining stock here; use the web app to correct its purchase details.",
        );
      if (quantity && (!Number.isFinite(count) || count <= 0))
        throw Error("Enter a valid supply pack quantity.");
      const outside =
        expense?.quantity && remaining !== ""
          ? count - used - Number(remaining)
          : expense?.outsideUseUnits;
      if (outside != null && (!Number.isFinite(outside) || outside < 0))
        throw Error("Remaining quantity cannot exceed available stock.");
      const record: Expense = {
        ...expense,
        id: recordId,
        kind,
        product,
        amount: roundMoney(cost),
        currency,
        date: expense?.date ?? new Date().toISOString().slice(0, 10),
        ...(quantity && equipmentKinds.includes(kind)
          ? {
              quantity: count,
              ...(outside != null ? { outsideUseUnits: outside } : {}),
            }
          : {}),
      };
      await mutate((s) => ({
        ...s,
        settings: {
          ...s.settings,
          collectionExpenses: [
            ...(s.settings.collectionExpenses ?? []).filter(
              (e) => e.id !== recordId,
            ),
            record,
          ],
        },
      }));
      await draft.clear();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Sheet
      title={expense ? "Edit expense" : "New expense"}
      onClose={() =>
        void draft
          .flush()
          .then(onClose)
          .catch((e) => Alert.alert("Keep this form open", e.message))
      }
    >
      <Screen>
        <Field
          label="Purchase / product"
          value={product}
          onChange={setProduct}
        />
        <Chips
          value={kind}
          onChange={(v) => {
            setKind(v);
            setQuantity("");
          }}
          items={Object.entries(expenseKinds).map(([id, label]) => ({
            id,
            label,
          }))}
        />
        <Field
          label="Total amount"
          value={amount}
          numeric
          onChange={setAmount}
        />
        <Chips
          value={currency}
          onChange={setCurrency}
          items={["USD", "CAD", "EUR", "GBP", "AUD", "NZD"].map((id) => ({
            id,
            label: id,
          }))}
        />
        {equipmentKinds.includes(kind) && (
          <>
            <Field
              label={"Pack quantity (" + supplyUnit(kind) + "s), optional"}
              value={quantity}
              numeric
              onChange={setQuantity}
            />
            {expense?.quantity && (
              <>
                <Field
                  label="Quantity remaining"
                  value={remaining}
                  numeric
                  onChange={setRemaining}
                />
                <Label muted>
                  Giving away supplies changes stock, while the full purchase
                  remains in your expenses.
                </Label>
              </>
            )}
          </>
        )}
        {error && <Label>{error}</Label>}
        {draft.error && <Label>{draft.error}</Label>}
        <Button
          title={busy ? "Saving…" : "Save expense"}
          primary
          disabled={!draft.ready || !!draft.error || busy}
          onPress={() => void save()}
        />
      </Screen>
    </Sheet>
  );
}
