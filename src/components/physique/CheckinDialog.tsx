import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { checkinPayload } from "@/lib/physique/payload";
import { usePhysique } from "@/lib/physique/store";

export function CheckinDialog({ trigger }: { trigger: ReactNode }) {
  const { active, addCheckin, emit } = usePhysique();
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [weight, setWeight] = useState(String(active.weight));
  const [waist, setWaist] = useState("");
  const [note, setNote] = useState("");

  const submit = async () => {
    const w = Number(weight.replace(",", "."));
    if (!w || w < 25 || w > 350) {
      toast.error("Podaj poprawną masę ciała (kg).");
      return;
    }
    const wa = Number(waist.replace(",", "."));
    const ci = addCheckin(active.id, {
      date,
      weight: w,
      ...(wa > 0 ? { waist: wa } : {}),
      ...(note.trim() ? { note: note.trim().slice(0, 300) } : {}),
    });
    setOpen(false);
    setNote("");
    setWaist("");
    toast.success(`Check-in zapisany dla: ${active.name}`);
    const res = await emit("checkin.submitted", checkinPayload({ ...active, weight: w }, ci), {
      clientName: active.name,
    });
    if (res && !res.ok) toast.error(`n8n: ${res.error ?? "błąd wysyłki"}`);
    if (res?.ok) toast.success("Check-in wysłany do n8n");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setWeight(String(active.weight));
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="border-border-strong bg-popover sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nowy check-in · {active.name}</DialogTitle>
          <DialogDescription>Masa ciała aktualizuje profil i kalkulacje energii.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ci-date">Data</Label>
            <Input id="ci-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ci-weight">Masa (kg)</Label>
            <Input id="ci-weight" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="ci-waist">Obwód talii (cm, opcjonalnie)</Label>
            <Input id="ci-waist" inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="ci-note">Notatka</Label>
            <Textarea id="ci-note" rows={2} value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Anuluj
          </Button>
          <Button onClick={submit}>Zapisz check-in</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
