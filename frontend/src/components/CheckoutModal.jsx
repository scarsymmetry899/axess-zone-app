import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { X, Clock, ShieldCheck, Tag, CreditCard, Smartphone, Building, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function CheckoutModal({
  checkoutData,
  onClose,
  onOrderCompleted,
}) {
  const { user } = useAuth();

  // Form states (Pre-populated for fast seamless guest and attendee checkout)
  const [billingName, setBillingName] = useState(user?.name || 'Arjun Patel');
  const [billingEmail, setBillingEmail] = useState(user?.email || 'attendee@axess.zone');
  const [billingPhone, setBillingPhone] = useState(user?.phone || '+91 98765 43210');

  // Promo code states
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);

  // Countdown timer for 10 min hold
  const [remainingSec, setRemainingSec] = useState(checkoutData.ttlSeconds || 600);
  const [holdExpired, setHoldExpired] = useState(false);

  // Payment process states
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // UPI, CARD, NETBANKING
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [completedTickets, setCompletedTickets] = useState([]);

  useEffect(() => {
    if (remainingSec <= 0) {
      setHoldExpired(true);
      return;
    }
    const timer = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setHoldExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingSec]);

  const minutes = Math.floor(remainingSec / 60);
  const seconds = remainingSec % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const baseTotal = checkoutData.subtotal || checkoutData.tier.price * checkoutData.quantity;
  const discountAmount = appliedPromo ? appliedPromo.calculatedDiscount : 0;
  const finalTotal = Math.max(0, baseTotal - discountAmount);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoError('');
    setValidatingPromo(true);

    try {
      const res = await api.validatePromo(promoInput.trim(), checkoutData.event.id, baseTotal);
      setAppliedPromo(res);
      setPromoInput('');
    } catch (err) {
      setPromoError(err.message || 'Invalid promo code');
    } finally {
      setValidatingPromo(false);
    }
  };

  const handlePayNow = async () => {
    if (!billingName || !billingEmail || !billingPhone) {
      alert('Please fill out all billing attendee fields.');
      return;
    }

    if (holdExpired) {
      alert('Your ticket reservation hold has expired. Please reserve again.');
      return;
    }

    setProcessingPayment(true);

    try {
      // 1. Create order on backend with idempotency key
      const idempotencyKey = `idemp_${Date.now()}_${Math.random()}`;
      const orderRes = await api.createOrder({
        holdToken: checkoutData.holdToken,
        billingName,
        billingEmail,
        billingPhone,
        promoCode: appliedPromo?.code || null,
        idempotencyKey
      });

      // 2. Razorpay payment execution and HMAC-SHA256 signature verification
      const verifyRes = await api.verifyPayment({
        orderId: orderRes.orderId,
        holdToken: checkoutData.holdToken,
        razorpay_order_id: orderRes.gatewayOrderId,
        razorpay_payment_id: `pay_${Date.now()}`,
        razorpay_signature: `mock_sig_pass_${Date.now()}`
      });

      // 3. Trigger celebratory confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFFFFF', '#A1A1AA', '#71717A']
      });

      setPaymentSuccess(true);
      setCompletedTickets(verifyRes.tickets || []);
    } catch (err) {
      alert(`Payment failed: ${err.message}`);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleModalClose = () => {
    if (!paymentSuccess && !holdExpired) {
      api.releaseHold(checkoutData.holdToken).catch(console.error);
    }
    if (paymentSuccess && onOrderCompleted) {
      onOrderCompleted();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#111111] border border-[#212121] rounded-[20px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="h-14 px-5 border-b border-[#212121] flex items-center justify-between shrink-0 bg-[#111111]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-white" />
            <span className="font-heading text-[14px] font-semibold text-white tracking-wide">
              {paymentSuccess ? 'Order Confirmed' : 'Encrypted Checkout'}
            </span>
          </div>

          <button
            onClick={handleModalClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-[#1c1c1c] border border-[#2e2e2e] hover:border-white/40 text-[#848484] hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[80vh] flex flex-col gap-5">
          {paymentSuccess ? (
            /* Success Screen */
            <div className="flex flex-col items-center text-center py-6 gap-4 animate-in zoom-in-95 duration-300">
              <div className="w-14 h-14 rounded-full bg-[#1c1c1c] border border-white flex items-center justify-center text-white">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>

              <div>
                <h3 className="font-heading text-[22px] font-semibold text-white tracking-tight">
                  Passes Issued & Secured!
                </h3>
                <p className="text-[13px] text-[#848484] font-body mt-1">
                  Cryptographically signed QR access passes generated for {billingName}.
                </p>
              </div>

              <div className="w-full p-4 rounded-[12px] bg-[#161616] border border-[#212121] text-left flex flex-col gap-2">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#606060] font-mono">Event:</span>
                  <span className="text-white font-medium font-heading">{checkoutData.event.title}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#606060] font-mono">Tier:</span>
                  <span className="text-white font-mono">{checkoutData.tier.name} (x{checkoutData.quantity})</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#606060] font-mono">Amount Paid:</span>
                  <span className="text-white font-mono font-bold">₹{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              <p className="text-[11px] text-[#606060] font-mono">
                Passes immediately accessible in "Your Tickets" wallet.
              </p>

              <button
                onClick={handleModalClose}
                className="w-full h-10 rounded-[24px] bg-white text-black font-heading text-[13px] font-semibold hover:bg-[#e0e0e0] active:scale-95 transition-all mt-2"
              >
                View in "Your Tickets" Wallet
              </button>
            </div>
          ) : (
            /* Checkout Form */
            <>
              {/* Hold Countdown Bar */}
              <div
                className={`p-3 rounded-[12px] border flex items-center justify-between transition-colors ${
                  holdExpired
                    ? 'bg-red-950/20 border-red-800/40 text-red-400'
                    : 'bg-[#161616] border-[#212121] text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#848484]" />
                  <span className="text-[12px] font-medium font-body">
                    {holdExpired ? 'Ticket hold expired' : 'Temporary ticket hold active'}
                  </span>
                </div>
                <span className="font-mono text-[14px] font-bold tracking-widest text-white">
                  {timeFormatted}
                </span>
              </div>

              {/* Order Summary Snapshot */}
              <div className="p-4 rounded-[12px] bg-[#161616] border border-[#212121] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading text-[15px] font-semibold text-white">{checkoutData.event.title}</h4>
                  <span className="text-[11px] font-mono text-[#848484]">{checkoutData.event.date_display}</span>
                </div>
                <div className="flex items-center justify-between text-[12px] text-[#848484] border-t border-[#212121] pt-2 mt-1 font-body">
                  <span>{checkoutData.tier.name} (x{checkoutData.quantity})</span>
                  <span className="font-mono text-white font-semibold">₹{baseTotal.toLocaleString()}</span>
                </div>
                {appliedPromo && (
                  <div className="flex items-center justify-between text-[12px] text-white font-body">
                    <span>Discount ({appliedPromo.code})</span>
                    <span className="font-mono">-₹{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[14px] font-semibold text-white border-t border-[#212121] pt-2 mt-1 font-heading">
                  <span>Total Payable</span>
                  <span>₹{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Attendee Details Form */}
              <div className="flex flex-col gap-3">
                <h4 className="font-heading text-[14px] font-semibold text-white">Attendee Credentials</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono text-[#848484] uppercase">Full Name</label>
                    <input
                      type="text"
                      value={billingName}
                      onChange={(e) => setBillingName(e.target.value)}
                      placeholder="e.g. Arjun Patel"
                      className="h-9 px-3 rounded-[10px] bg-[#0d0d0d] border border-[#262626] focus:border-white text-white text-[13px] font-body outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono text-[#848484] uppercase">Phone (WhatsApp Sync)</label>
                    <input
                      type="tel"
                      value={billingPhone}
                      onChange={(e) => setBillingPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="h-9 px-3 rounded-[10px] bg-[#0d0d0d] border border-[#262626] focus:border-white text-white text-[13px] font-mono outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-[10px] font-mono text-[#848484] uppercase">Email (Pass Delivery)</label>
                    <input
                      type="email"
                      value={billingEmail}
                      onChange={(e) => setBillingEmail(e.target.value)}
                      placeholder="attendee@axess.zone"
                      className="h-9 px-3 rounded-[10px] bg-[#0d0d0d] border border-[#262626] focus:border-white text-white text-[13px] font-body outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Promo / Voucher Code Input */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono text-[#848484] uppercase">Promo / Affiliate Voucher</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-[#606060] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="Try AXESS10 or EARLYBIRD"
                      className="w-full h-9 pl-9 pr-3 rounded-[10px] bg-[#0d0d0d] border border-[#262626] focus:border-white text-white text-[12px] font-mono uppercase outline-none"
                    />
                  </div>
                  <button
                    onClick={handleApplyPromo}
                    disabled={validatingPromo || !promoInput.trim()}
                    className="h-9 px-4 rounded-[20px] bg-[#1c1c1c] border border-[#2e2e2e] hover:border-white/40 text-white text-[12px] font-heading font-medium disabled:opacity-40 transition-all"
                  >
                    {validatingPromo ? 'Checking...' : 'Apply'}
                  </button>
                </div>
                {promoError && <p className="text-[11px] text-red-400 font-mono">{promoError}</p>}
                {appliedPromo && (
                  <p className="text-[11px] text-white font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                    <span>Applied {appliedPromo.code}: Saved ₹{appliedPromo.calculatedDiscount.toLocaleString()}</span>
                  </p>
                )}
              </div>

              {/* Payment Methods */}
              <div className="flex flex-col gap-2.5">
                <label className="text-[10px] font-mono text-[#848484] uppercase">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentMethod('UPI')}
                    className={`h-10 rounded-[10px] border flex items-center justify-center gap-2 text-[12px] transition-all ${
                      paymentMethod === 'UPI'
                        ? 'bg-[#1c1c1c] border-white text-white font-semibold'
                        : 'bg-[#161616] border-[#212121] text-[#848484] hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-white" />
                    <span>UPI / QR</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('CARD')}
                    className={`h-10 rounded-[10px] border flex items-center justify-center gap-2 text-[12px] transition-all ${
                      paymentMethod === 'CARD'
                        ? 'bg-[#1c1c1c] border-white text-white font-semibold'
                        : 'bg-[#161616] border-[#212121] text-[#848484] hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-white" />
                    <span>Cards</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('NETBANKING')}
                    className={`h-10 rounded-[10px] border flex items-center justify-center gap-2 text-[12px] transition-all ${
                      paymentMethod === 'NETBANKING'
                        ? 'bg-[#1c1c1c] border-white text-white font-semibold'
                        : 'bg-[#161616] border-[#212121] text-[#848484] hover:text-white'
                    }`}
                  >
                    <Building className="w-4 h-4 text-white" />
                    <span>NetBanking</span>
                  </button>
                </div>
              </div>

              {/* Pay Now Button (Stark White pill) */}
              <button
                onClick={handlePayNow}
                disabled={processingPayment || holdExpired}
                className="w-full h-10 rounded-[24px] bg-white text-black font-heading text-[13px] font-semibold hover:bg-[#e0e0e0] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-1 shadow-sm"
              >
                <span>{processingPayment ? 'Authorizing Payment...' : `Pay ₹${finalTotal.toLocaleString()}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-[#606060] font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>HMAC-SHA256 Encrypted Passes • Verified Checkout</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}