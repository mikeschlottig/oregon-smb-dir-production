import { useState } from "react";
import { Loader2, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { publisher } from "@/data/publisher";

type FieldErrors = Partial<Record<"name" | "email" | "message", string>>;

const ENDPOINT =
  (import.meta.env.PUBLIC_CONTACT_ENDPOINT as string | undefined) ||
  "https://contact.oregonsmbdirectory.com";

const validate = (data: {
  name: string;
  email: string;
  message: string;
}): FieldErrors => {
  const errs: FieldErrors = {};
  if (!data.name.trim()) errs.name = "Name is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
    errs.email = "Enter a valid email.";
  if (data.message.trim().length < 10)
    errs.message = "Message must be at least 10 characters.";
  return errs;
};

interface Props {
  defaultBusiness?: string;
  defaultCity?: string;
  defaultIndustry?: string;
}

export default function ContactForm({
  defaultBusiness = "",
  defaultCity = "",
  defaultIndustry = "",
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [business, setBusiness] = useState(defaultBusiness);
  const [city, setCity] = useState(defaultCity);
  const [industry, setIndustry] = useState(defaultIndustry);
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    const errs = validate({ name, email, message });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setStatus("loading");
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim() || undefined,
          business: business.trim() || undefined,
          city: city.trim() || undefined,
          industry: industry.trim() || undefined,
          message: message.trim(),
          source: typeof window !== "undefined" ? window.location.pathname : undefined,
          honeypot,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setStatus("error");
        setServerError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setStatus("success");
      setName("");
      setEmail("");
      setSubject("");
      setBusiness(defaultBusiness);
      setCity(defaultCity);
      setIndustry(defaultIndustry);
      setMessage("");
    } catch {
      setStatus("error");
      setServerError(`Network error. Please try again or email ${publisher.supportEmail} directly.`);
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-8 text-center">
        <CheckCircle2 className="w-12 h-12 mx-auto text-primary mb-4" />
        <h3 className="font-serif text-2xl font-bold mb-2">Message sent</h3>
        <p className="text-muted-foreground">
          Thanks — we'll be in touch soon. For urgent matters, email{" "}
          <a className="text-primary underline" href={`mailto:${publisher.supportEmail}`}>
            {publisher.supportEmail}
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  const inputBase =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary";

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {Object.keys(errors).length > 0 && (
        <div role="alert" aria-live="assertive" className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <p className="font-semibold mb-1">Please correct the highlighted fields.</p>
          <ul className="list-disc pl-5">
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}><a href={`#cf-${field}`} className="underline">{message}</a></li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="cf-name">
            Name<span className="text-accent">*</span>
          </label>
          <input
            id="cf-name"
            className={inputBase}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
            maxLength={200}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "cf-name-error" : undefined}
          />
          {errors.name && <p id="cf-name-error" className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="cf-email">
            Email<span className="text-accent">*</span>
          </label>
          <input
            id="cf-email"
            type="email"
            className={inputBase}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            maxLength={200}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "cf-email-error" : undefined}
          />
          {errors.email && <p id="cf-email-error" className="text-xs text-destructive mt-1">{errors.email}</p>}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="cf-business">
            Business name <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            id="cf-business"
            className={inputBase}
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
            maxLength={200}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="cf-city">
            City <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            id="cf-city"
            className={inputBase}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            maxLength={100}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" htmlFor="cf-subject">
          Subject <span className="text-muted-foreground">(optional)</span>
        </label>
        <input
          id="cf-subject"
          className={inputBase}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={200}
          placeholder="List my business / Press inquiry / Partnership / Other"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" htmlFor="cf-message">
          Message<span className="text-accent">*</span>
        </label>
        <textarea
          id="cf-message"
          className={`${inputBase} min-h-[160px] resize-y`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={10}
          maxLength={8000}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "cf-message-error" : undefined}
        />
        {errors.message && <p id="cf-message-error" className="text-xs text-destructive mt-1">{errors.message}</p>}
      </div>

      <div className="hidden" aria-hidden="true">
        <label>
          Leave blank
          <input
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </label>
      </div>

      {serverError && (
        <div role="alert" aria-live="assertive" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            <Send className="w-4 h-4" /> Send message
          </>
        )}
      </button>
    </form>
  );
}
