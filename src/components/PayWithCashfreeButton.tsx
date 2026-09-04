import { useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { createCashfreePaymentLink } from "@/lib/cashfree.functions";
import { redirectToCashfreeCheckout } from "@/lib/cashfreeCheckout";

interface CashfreeItem {
  name: string;
  qty: number;
  price: number;
  variantId?: string;
  product_id?: string;
  edition_name?: string;
  edition_price_cents?: number;
}

interface Shipping {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
}

interface Props {
  items: CashfreeItem[];
  amount: number;
  name: string;
  email: string;
  phone: string;
  discord?: string;
  shipping?: Shipping;
  couponCode?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  onCreated?: (orderId: string) => void;
  onInitiate?: () => void;
  onError?: () => void;
}

export function PayWithCashfreeButton({
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
  label = "Buy it now",
  onCreated,
  onInitiate,
  onError,
}: Props) {
  const createLink = useServerFn(createCashfreePaymentLink);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading || disabled) return;
    if (!items.length || amount <= 0) {
      toast.error("Cart Empty", { description: "Add an item before checking out." });
      return;
    }
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error("Missing details", { description: "Please enter your name, email and phone." });
      return;
    }
    onInitiate?.();
    setLoading(true);
    try {
      const res = await createLink({
        data: { items, amount, name, email, phone, discord, shipping, coupon_code: couponCode },
      });
      if (!res?.ok || !res.paymentSessionId) {
        const msg = (res as { error?: string })?.error || "";
        if (/not configured/i.test(msg)) {
          toast.error("Payments Unavailable", {
            description: "Card/UPI payments are temporarily offline. Please try crypto or try again shortly.",
          });
        } else {
          toast.error("Checkout Failed", { description: msg || "Couldn't start Cashfree checkout." });
        }
        onError?.();
        return;
      }
      onCreated?.(res.orderId);
      await redirectToCashfreeCheckout(res.paymentSessionId, res.returnUrl);
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
        "w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-md text-sm font-semibold bg-white text-black hover:bg-neutral-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
      }
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
      {label}
    </button>
  );
}
