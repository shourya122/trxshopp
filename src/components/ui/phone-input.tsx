import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { CountrySelect } from "@/components/ui/country-select";
import { COUNTRIES, splitPhone, type Country } from "@/lib/countries";

interface Props {
  /** Full phone string like "+91 9876543210". */
  value: string;
  onChange: (full: string) => void;
  /** Default country if value has no dial code yet. */
  defaultCountry?: string;
  placeholder?: string;
}

export function PhoneInput({ value, onChange, defaultCountry = "IN", placeholder = "Phone number" }: Props) {
  const initial = splitPhone(value);
  const [country, setCountry] = useState<Country>(
    initial.country || COUNTRIES.find((c) => c.code === defaultCountry) || COUNTRIES[0],
  );
  const [rest, setRest] = useState<string>(initial.rest);

  // Re-sync if parent value changes (e.g. profile loaded after mount).
  useEffect(() => {
    const split = splitPhone(value);
    if (split.country) setCountry(split.country);
    setRest(split.rest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emit = (c: Country, r: string) => {
    const cleaned = r.trim();
    onChange(cleaned ? `${c.dial} ${cleaned}` : "");
  };

  return (
    <div className="flex gap-2">
      <CountrySelect
        value={country.code}
        compact
        onChange={(c) => {
          setCountry(c);
          emit(c, rest);
        }}
      />
      <Input
        type="tel"
        inputMode="tel"
        value={rest}
        onChange={(e) => {
          // strip non-digits/spaces, leave a clean national number
          const v = e.target.value.replace(/[^\d\s-]/g, "");
          setRest(v);
          emit(country, v);
        }}
        placeholder={placeholder}
        maxLength={20}
        className="flex-1"
      />
    </div>
  );
}
