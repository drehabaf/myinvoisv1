"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  Receipt,
  Building2,
  MapPin,
  CalendarDays,
  Plus,
  Trash2,
  Download,
  Eye,
  X,
} from "lucide-react";

const STORAGE_KEY = "invoice_receipt_running_numbers_v3";

const SAFE = {
  pageBg: "#f1f5f9",
  white: "#ffffff",
  black: "#0f172a",
  muted: "#64748b",
  mutedLight: "#94a3b8",
  border: "#e2e8f0",
  soft: "#f8fafc",
  soft2: "#f1f5f9",
};

const COLORS = {
  merah: { name: "Merah", hex: "#dc2626" },
  biru: { name: "Biru", hex: "#2563eb" },
  hitam: { name: "Hitam", hex: "#171717" },
  kuning: { name: "Kuning", hex: "#facc15" },
};

const DEFAULT_FORM = {
  companyName: "",
  headerColor: "biru",
  address: "",
  items: [{ id: 1, detail: "", price: "" }],
};

const toCaps = (value: unknown) => String(value || "").toUpperCase();

type DocType = "INVOIS" | "RESIT";
type ColorKey = keyof typeof COLORS;
type Item = { id: number; detail: string; price: string };
type RunningNumbers = Record<DocType, number>;

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

function safeStorageGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.error("LocalStorage read error:", error);
    return fallback;
  }
}

function safeStorageSet(key: string, value: unknown) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("LocalStorage write error:", error);
  }
}

function getStoredNumbers(): RunningNumbers {
  const value = safeStorageGet<Partial<RunningNumbers>>(STORAGE_KEY, { INVOIS: 1, RESIT: 1 });

  return {
    INVOIS: Number(value?.INVOIS) > 0 ? Number(value.INVOIS) : 1,
    RESIT: Number(value?.RESIT) > 0 ? Number(value.RESIT) : 1,
  };
}

function formatDateCode(dateString?: string) {
  const rawDate = dateString || getTodayISO();
  return String(rawDate).replace(/-/g, "");
}

function formatDocNumber(type: DocType, number: number, dateString?: string) {
  const prefix = type === "INVOIS" ? "INV" : "RCPT";
  const dateCode = formatDateCode(dateString);
  return `${prefix}-${dateCode}-${String(number).padStart(4, "0")}`;
}

function cleanFileName(value: string, fallback: string) {
  const cleaned = String(value || fallback)
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || fallback;
}

function formatDisplayDate(dateString: string) {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleDateString("ms-MY", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function runSelfTests() {
  console.assert(formatDateCode("2026-05-31") === "20260531", "Test failed: date should format as YYYYMMDD");
  console.assert(formatDocNumber("INVOIS", 1, "2026-05-31") === "INV-20260531-0001", "Test failed: INVOIS should include date and running number");
  console.assert(formatDocNumber("RESIT", 12, "2026-05-31") === "RCPT-20260531-0012", "Test failed: RESIT should include date and running number");
  console.assert(formatDocNumber("INVOIS", 9999, "2026-05-31") === "INV-20260531-9999", "Test failed: INVOIS 9999 should include date");
  console.assert(toCaps("ali imran") === "ALI IMRAN", "Test failed: text should convert to uppercase");
  console.assert(cleanFileName("Ali Imran", "PELANGGAN") === "ALI-IMRAN", "Test failed: filename should be cleaned");
  console.assert(cleanFileName("", "PELANGGAN") === "PELANGGAN", "Test failed: filename fallback should work");

  console.assert(formatDateCode("2026-01-05") === "20260105", "Test failed: date should keep leading zero month/day");
  console.assert(formatDocNumber("RESIT", 1, "2026-01-05") === "RCPT-20260105-0001", "Test failed: RESIT 1 should be padded");
  console.assert(cleanFileName("Ali / Imran @ Drehab", "PELANGGAN") === "ALI-IMRAN-DREHAB", "Test failed: filename symbols should be replaced");
  console.assert(formatDisplayDate("") === "-", "Test failed: empty display date should return dash");
  console.assert(DEFAULT_FORM.companyName === "", "Test failed: default company name should be empty");
  console.assert(DEFAULT_FORM.address === "", "Test failed: default address should be empty");
}

type DocumentViewProps = {
  companyName: string;
  address: string;
  color: { name: string; hex: string };
  docType: DocType;
  docNumber: string;
  formattedDate: string;
  customerName: string;
  items: Item[];
  total: number;
};

function DocumentView({ companyName, address, color, docType, docNumber, formattedDate, customerName, items, total }: DocumentViewProps) {
  return (
    <section
      className="mx-auto overflow-hidden rounded-3xl"
      style={{ backgroundColor: SAFE.white, border: `1px solid ${SAFE.border}`, color: SAFE.black }}
    >
      <div className="p-5 text-white" style={{ backgroundColor: color.hex, color: SAFE.white }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-wide" style={{ color: SAFE.white }}>
              {companyName || "NAMA SYARIKAT"}
            </h2>
            <p className="mt-2 max-w-md whitespace-pre-line text-sm" style={{ color: SAFE.white, opacity: 0.92 }}>
              {address || "ALAMAT SYARIKAT"}
            </p>
          </div>

          <div
            className="rounded-2xl px-4 py-3 text-right"
            style={{ backgroundColor: "rgba(255,255,255,0.18)", color: SAFE.white }}
          >
            <p className="text-2xl font-black" style={{ color: SAFE.white }}>
              {docType}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5" style={{ backgroundColor: SAFE.white }}>
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl p-4" style={{ backgroundColor: SAFE.soft }}>
            <p className="text-xs font-bold uppercase" style={{ color: SAFE.mutedLight }}>
              Tarikh
            </p>
            <p className="mt-1 font-bold" style={{ color: SAFE.black }}>
              {formattedDate}
            </p>
          </div>

          <div className="rounded-2xl p-4" style={{ backgroundColor: SAFE.soft }}>
            <p className="text-xs font-bold uppercase" style={{ color: SAFE.mutedLight }}>
              No. {docType}
            </p>
            <p className="mt-1 font-bold" style={{ color: SAFE.black }}>
              {docNumber || "-"}
            </p>
          </div>

          <div className="rounded-2xl p-4" style={{ backgroundColor: SAFE.soft }}>
            <p className="text-xs font-bold uppercase" style={{ color: SAFE.mutedLight }}>
              Nama
            </p>
            <p className="mt-1 font-bold" style={{ color: SAFE.black }}>
              {customerName || "-"}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl" style={{ border: `1px solid ${SAFE.border}` }}>
          <table className="w-full border-collapse text-left text-sm" style={{ backgroundColor: SAFE.white, color: SAFE.black }}>
            <thead style={{ backgroundColor: color.hex, color: SAFE.white }}>
              <tr>
                <th className="w-12 px-4 py-3">#</th>
                <th className="px-4 py-3">Butiran</th>
                <th className="w-36 px-4 py-3 text-right">Harga</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} style={{ borderBottom: `1px solid ${SAFE.border}` }}>
                  <td className="px-4 py-3" style={{ color: SAFE.mutedLight }}>
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: SAFE.black }}>
                    {item.detail || "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-bold" style={{ color: SAFE.black }}>
                    RM {(parseFloat(item.price) || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex justify-end">
          <div className="w-full max-w-xs rounded-2xl p-4" style={{ backgroundColor: SAFE.soft }}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold" style={{ color: SAFE.muted }}>
                Jumlah Keseluruhan
              </span>
              <span className="text-2xl font-black" style={{ color: color.hex }}>
                RM {total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-sm font-bold" style={{ color: SAFE.muted }}>
              Nota
            </p>
            <p className="mt-2 text-sm" style={{ color: SAFE.muted }}>
              Dokumen ini dijana sebagai rekod bayaran dan rujukan pelanggan.
            </p>
          </div>

          <div className="text-right">
            <div className="ml-auto mt-8 h-px w-48" style={{ backgroundColor: SAFE.border }} />
            <p className="mt-2 text-sm font-bold" style={{ color: SAFE.black }}>
              Tandatangan / Cop Syarikat
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function InvoiceReceiptApp() {
  const today = getTodayISO();

  const [docType, setDocType] = useState<DocType>("INVOIS");
  const [companyName, setCompanyName] = useState(DEFAULT_FORM.companyName);
  const [headerColor, setHeaderColor] = useState<ColorKey>(DEFAULT_FORM.headerColor as ColorKey);
  const [address, setAddress] = useState(DEFAULT_FORM.address);
  const [date, setDate] = useState(today);
  const [runningNumbers, setRunningNumbers] = useState<RunningNumbers>({ INVOIS: 1, RESIT: 1 });
  const [docNumber, setDocNumber] = useState(() => formatDocNumber("INVOIS", 1, today));
  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState<Item[]>(DEFAULT_FORM.items);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const pdfRef = useRef<HTMLDivElement | null>(null);

  const color = COLORS[headerColor] || COLORS.biru;

  useEffect(() => {
    runSelfTests();
  }, []);

  useEffect(() => {
    const numbers = getStoredNumbers();
    setRunningNumbers(numbers);
    setDocNumber(formatDocNumber("INVOIS", numbers.INVOIS || 1, today));
    setHasLoadedStorage(true);
  }, [today]);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    safeStorageSet(STORAGE_KEY, runningNumbers);
  }, [hasLoadedStorage, runningNumbers]);

  useEffect(() => {
    setDocNumber(formatDocNumber(docType, runningNumbers[docType] || 1, date));
  }, [date, docType, runningNumbers]);

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  }, [items]);

  const formattedDate = useMemo(() => formatDisplayDate(date), [date]);

  const documentProps = {
    companyName,
    address,
    color,
    docType,
    docNumber,
    formattedDate,
    customerName,
    items,
    total,
  };

  const inputClass = "w-full rounded-xl border px-3 py-3 text-sm outline-none";
  const labelClass = "mb-2 flex items-center gap-2 text-sm font-bold";

  const handleDocTypeChange = (type: DocType) => {
    const numbers = getStoredNumbers();
    setRunningNumbers(numbers);
    setDocType(type);
    setDocNumber(formatDocNumber(type, numbers[type] || 1, date));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { id: Date.now(), detail: "", price: "" }]);
  };

  const updateItem = (id: number, field: keyof Item, value: string) => {
    const nextValue = field === "detail" ? toCaps(value) : value;
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: nextValue } : item)));
  };

  const removeItem = (id: number) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((item) => item.id !== id)));
  };

  const resetForm = () => {
    if (typeof window !== "undefined") {
      const confirmReset = window.confirm("Padam semua maklumat yang telah diisi?");
      if (!confirmReset) return;
    }

    const resetDate = getTodayISO();
    const numbers = getStoredNumbers();

    setCompanyName(DEFAULT_FORM.companyName);
    setHeaderColor(DEFAULT_FORM.headerColor as ColorKey);
    setAddress(DEFAULT_FORM.address);
    setDate(resetDate);
    setCustomerName("");
    setItems([{ id: Date.now(), detail: "", price: "" }]);
    setRunningNumbers(numbers);
    setDocNumber(formatDocNumber(docType, numbers[docType] || 1, resetDate));
    setShowPreview(false);
  };

  const advanceRunningNumber = () => {
    setRunningNumbers((prev) => {
      const current = prev[docType] || 1;
      const updated = { ...prev, [docType]: current + 1 };
      safeStorageSet(STORAGE_KEY, updated);
      setDocNumber(formatDocNumber(docType, updated[docType], date));
      return updated;
    });
  };

  const saveAsPDF = async () => {
    if (!pdfRef.current || isSaving) return;

    try {
      setIsSaving(true);
      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default;

      const jspdfModule = await import("jspdf");
      const jsPDF = jspdfModule.jsPDF;

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: SAFE.white,
        ignoreElements: (element) => element.classList?.contains("no-pdf"),
        onclone: (clonedDoc) => {
          clonedDoc.querySelectorAll<HTMLElement>("*").forEach((el) => {
            el.style.boxShadow = "none";
            el.style.textShadow = "none";
          });
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const cleanNumber = cleanFileName(docNumber, docType);
      const cleanName = cleanFileName(customerName, "PELANGGAN");
      pdf.save(`${docType}-${cleanNumber}-${cleanName}.pdf`);
      advanceRunningNumber();
    } catch (error) {
      console.error(error);
      if (typeof window !== "undefined") {
        window.alert("Gagal save PDF. Jalankan: npm install html2canvas jspdf. Jika masih error, pastikan app guna versi html2canvas terbaru.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-3" style={{ backgroundColor: SAFE.pageBg, color: SAFE.black }}>
      <div className="mx-auto max-w-xl">
        <section className="rounded-3xl p-4" style={{ backgroundColor: SAFE.white, border: `1px solid ${SAFE.border}` }}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl p-3 text-white" style={{ backgroundColor: SAFE.black }}>
                <FileText size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold">myInvois</h1>
              </div>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: "#dc2626", color: SAFE.white, border: "0" }}
              title="Reset"
              aria-label="Reset form"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl p-1" style={{ backgroundColor: "#dbeafe" }}>
            {(["INVOIS", "RESIT"] as DocType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleDocTypeChange(type)}
                className="rounded-xl px-3 py-2 text-sm font-bold transition"
                style={{
                  backgroundColor: docType === type ? "#2563eb" : "#eff6ff",
                  color: docType === type ? SAFE.white : "#2563eb",
                  border: docType === type ? "1px solid #2563eb" : "1px solid #bfdbfe",
                }}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl p-3" style={{ border: `1px solid ${SAFE.border}` }}>
              <label className={labelClass}>
                <Building2 size={16} /> Syarikat
              </label>
              <input
                value={companyName}
                onChange={(event) => setCompanyName(toCaps(event.target.value))}
                className={inputClass}
                style={{ borderColor: SAFE.border, backgroundColor: SAFE.white, color: SAFE.black, textTransform: "uppercase" }}
                placeholder=""
              />

              <div className="mt-3 flex gap-3">
                {Object.entries(COLORS).map(([key, item]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setHeaderColor(key as ColorKey)}
                    className="flex h-10 w-10 items-center justify-center rounded-full transition"
                    style={{
                      backgroundColor: item.hex,
                      border: headerColor === key ? `4px solid ${SAFE.black}` : `4px solid ${SAFE.white}`,
                      transform: headerColor === key ? "scale(1.08)" : "scale(1)",
                    }}
                    title={item.name}
                    aria-label={item.name}
                  >
                    {headerColor === key ? <span className="h-3 w-3 rounded-full" style={{ backgroundColor: SAFE.white }} /> : null}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>
                <MapPin size={16} /> Alamat
              </label>
              <textarea
                value={address}
                onChange={(event) => setAddress(toCaps(event.target.value))}
                rows={3}
                className={inputClass}
                style={{ borderColor: SAFE.border, backgroundColor: SAFE.white, color: SAFE.black, textTransform: "uppercase" }}
                placeholder=""
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>
                  <CalendarDays size={16} /> Tarikh
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className={inputClass}
                  style={{ borderColor: SAFE.border, backgroundColor: SAFE.white, color: SAFE.black }}
                />
              </div>

              <div>
                <label className={labelClass}>
                  <Receipt size={16} /> No. {docType}
                </label>
                <input
                  value={docNumber}
                  readOnly
                  className={inputClass}
                  style={{ borderColor: SAFE.border, backgroundColor: SAFE.soft, color: SAFE.black, fontWeight: 800 }}
                  placeholder="INV-0001"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">Nama</label>
              <input
                value={customerName}
                onChange={(event) => setCustomerName(toCaps(event.target.value))}
                className={inputClass}
                style={{ borderColor: SAFE.border, backgroundColor: SAFE.white, color: SAFE.black, textTransform: "uppercase" }}
                placeholder=""
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-bold">Butiran</label>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-white"
                  style={{ backgroundColor: SAFE.black, border: "0" }}
                >
                  <Plus size={14} /> Tambah
                </button>
              </div>

              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_88px_36px] gap-2">
                    <input
                      value={item.detail}
                      onChange={(event) => updateItem(item.id, "detail", event.target.value)}
                      className="rounded-xl border px-3 py-3 text-sm outline-none"
                      style={{ borderColor: SAFE.border, backgroundColor: SAFE.white, color: SAFE.black, textTransform: "uppercase" }}
                      placeholder=""
                    />

                    <div className="relative">
                      <span
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold"
                        style={{ color: SAFE.muted }}
                      >
                        RM
                      </span>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(event) => updateItem(item.id, "price", event.target.value)}
                        className="w-full rounded-xl border py-3 pl-9 pr-2 text-sm outline-none"
                        style={{ borderColor: SAFE.border, backgroundColor: SAFE.white, color: SAFE.black }}
                        placeholder="0"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="rounded-xl border"
                      style={{ borderColor: SAFE.border, backgroundColor: SAFE.white, color: SAFE.muted }}
                      aria-label="Buang butiran"
                    >
                      <Trash2 size={16} className="mx-auto" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-bold text-white"
              style={{ backgroundColor: color.hex, border: "0" }}
            >
              <Eye size={18} /> Papar {docType}
            </button>

            <button
              type="button"
              onClick={saveAsPDF}
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-bold text-white disabled:opacity-60"
              style={{ backgroundColor: SAFE.black, border: "0" }}
            >
              <Download size={18} /> {isSaving ? "Sedang Jana PDF..." : "Save PDF"}
            </button>
          </div>
        </section>

        <div className="fixed -left-[9999px] top-0 w-[794px]">
          <div ref={pdfRef}>
            <DocumentView {...documentProps} />
          </div>
        </div>

        {showPreview ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3"
            style={{ backgroundColor: "rgba(15,23,42,0.72)" }}
          >
            <div
              className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-3xl"
              style={{ backgroundColor: SAFE.white }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: `1px solid ${SAFE.border}` }}
              >
                <div>
                  <p className="text-xs font-bold uppercase" style={{ color: SAFE.muted }}>
                    Preview Dokumen
                  </p>
                  <h2 className="text-lg font-black" style={{ color: SAFE.black }}>
                    {docType} - {docNumber}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: SAFE.soft, color: SAFE.black, border: "0" }}
                  aria-label="Tutup preview"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[72vh] overflow-auto p-3" style={{ backgroundColor: SAFE.soft2 }}>
                <DocumentView {...documentProps} />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
