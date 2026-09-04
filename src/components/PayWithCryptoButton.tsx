import { useState } from "react";
import { Loader2, Bitcoin } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { createCryptoInvoice } from "@/lib/oxapay.functions";

interface CryptoItem {
  name: string;
  qty: number;
  price: number;
  variantId?: string;
  product_id?: string;
  edition_name?: string;
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
  items: CryptoItem[];
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

export function PayWithCryptoButton({
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
  label = "Pay with Crypto",
  onInitiate,
  onError,
}: Props) {
  const createInvoice = useServerFn(createCryptoInvoice);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading || disabled) return;
    if (!items.length || amount <= 0) {
      toast.error("Cart Empty", {
        description: "Add an item before initiating a crypto checkout.",
      });
      return;
    }
    onInitiate?.();
    setLoading(true);
    try {
      const res = await createInvoice({
        data: { items, amount, email, name, phone, discord, shipping, coupon_code: couponCode },
      });
      if (res?.ok && res.payLink) {
        window.open(res.payLink, "_blank", "noopener");
        toast.success("Invoice Ready", {
          description: "Your crypto checkout has opened in a new tab.",
        });
      } else {
        const msg = (res as { error?: string })?.error || "";
        if (/below the minimum/i.test(msg)) {
          toast.error("Order Below Minimum", {
            description:
              "Crypto payments require a slightly higher order total. Please add another item or choose UPI / card at checkout.",
            duration: 6500,
          });
        } else if (/above the maximum/i.test(msg)) {
          toast.error("Order Exceeds Limit", {
            description: "This order exceeds the crypto gateway maximum. Please split the order or use another payment method.",
            duration: 6500,
          });
        } else if (/not configured/i.test(msg)) {
          toast.error("Crypto Unavailable", {
            description: "Crypto payments are temporarily offline. Please use UPI or card.",
          });
        } else {
          toast.error("Crypto Checkout Failed", {
            description: msg || "Something went wrong while preparing your invoice.",
          });
        }
        onError?.();
      }
    } catch (e) {
      toast.error("Crypto Checkout Failed", {
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
        "w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-md text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
      }
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Bitcoin className="w-4 h-4" />
      )}
      {label}
    </button>
  );
}
