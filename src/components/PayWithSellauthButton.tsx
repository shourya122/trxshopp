import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { createSellauthCheckout } from "@/lib/sellauth.functions";
import { isSignedIn } from "@/lib/require-signin";
import { useNavigate } from "@tanstack/react-router";

interface SellauthItem {
  name: string;
  qty: number;
  price: number;
  variantId?: string;
  product_id?: string;
  edition_name?: string;
  options?: Record<string, string>;
}

interface ShippingInput {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

interface Props {
  items: SellauthItem[];
  amount: number;
  name?: string;
  email?: string;
  phone?: string;
  discord?: string;
  shipping?: ShippingInput;
  couponCode?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  onInitiate?: () => void;
  onError?: () => void;
}

export function PayWithSellauthButton({
  items,
  amount,
  name,
  email,
  phone,
  discord,
  shipping,
  couponCode,
  disabled,
  className,
  label = "Pay Securely",
  onInitiate,
  onError,
}: Props) {
  const createCheckout = useServerFn(createSellauthCheckout);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading || disabled) return;
    if (!(await isSignedIn())) {
      toast.error("Sign in required", {
        description: "Please sign in to complete your purchase.",
        duration: 3500,
      });
      navigate({ to: "/signin" });
      return;
    }
    if (!items.length || amount <= 0) {
      toast.error("Cart Empty", {
        description: "Add an item before checking out.",
      });
      return;
    }
    onInitiate?.();
    setLoading(true);
    try {
      const res = await createCheckout({
        data: { items, amount, email, name, phone, discord, shipping, coupon_code: couponCode },
      });
      if (res?.ok && res.payLink) {
        toast.success("Checkout Ready", {
          description: "Taking you to the secure payment page…",
        });
        window.location.assign(res.payLink);
      } else {
        const msg = (res as { error?: string })?.error || "";
        if (/not configured/i.test(msg)) {
          toast.error("Checkout Unavailable", {
            description: "This payment method is temporarily offline. Please use UPI, card or crypto.",
          });
        } else {
          toast.error("Checkout Failed", {
            description: msg || "Something went wrong while preparing your checkout.",
          });
        }
        onError?.();
      }
    } catch (e) {
      toast.error("Checkout Failed", {
        description: (e as Error)?.message || "Network error. Please try again.",
      });
      onError?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className={
        className ??
        "w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-md text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
      }
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <ShieldCheck className="w-4 h-4" />
      )}
      {label}
    </button>
  );
}
