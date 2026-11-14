'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FLAVOURS, Flavour, TASTING_COFFRET } from '@/lib/constants';
import { getAssetPath } from '@/lib/utils';
import { luxuryAudio } from '@/lib/audio';
import { submitHarvestOrder } from '@/lib/orders';
import { X, Award, MapPin, Truck, Loader2, Sparkles } from 'lucide-react';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedFlavour?: Flavour | null;
}

type SelectionOption = {
  id: string;
  name: string;
  volume: string;
  price: string;
  priceNum: number;
  color: string;
  isCoffret?: boolean;
};

const COFFRET_OPTION: SelectionOption = {
  id: TASTING_COFFRET.id,
  name: TASTING_COFFRET.shortName,
  volume: TASTING_COFFRET.volume,
  price: TASTING_COFFRET.price,
  priceNum: TASTING_COFFRET.priceNum,
  color: TASTING_COFFRET.color,
  isCoffret: true,
};

export function OrderModal({ isOpen, onClose, preselectedFlavour }: OrderModalProps) {
  const [selectedOption, setSelectedOption] = useState<SelectionOption>(
    preselectedFlavour || COFFRET_OPTION
  );
  const [quantity, setQuantity] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: 'Bhopal, Madhya Pradesh',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (preselectedFlavour) {
        setSelectedOption(preselectedFlavour);
        setQuantity(2);
      } else {
        setSelectedOption(COFFRET_OPTION);
        setQuantity(1);
      }
      setIsSubmitted(false);
      setErrorMsg(null);
    }
  }, [isOpen, preselectedFlavour]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalPrice = selectedOption.priceNum * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const order = await submitHarvestOrder({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        flavourId: selectedOption.id,
        flavourName: selectedOption.name,
        bottles: selectedOption.isCoffret ? quantity * 4 : quantity,
        totalPrice,
      });

      setConfirmedOrder(order);
      setIsSubmitted(true);
      luxuryAudio.playChime();
    } catch {
      setErrorMsg('Unable to reserve this allocation right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-2xl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        data-lenis-prevent
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Reserve ÉLAN Harvest Batch Allocation"
        className="relative w-full max-w-2xl bg-elan-dark border border-elan-gold/30 rounded-3xl overflow-hidden p-6 sm:p-10 shadow-[0_0_80px_rgba(0,0,0,0.95)] max-h-[85vh] overflow-y-auto no-scrollbar"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close reservation modal"
          className="absolute top-6 right-6 p-2.5 rounded-full border border-white/15 text-elan-cream hover:text-elan-gold hover:border-elan-gold transition-colors z-20"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {!isSubmitted ? (
          <div>
            <div className="text-center mb-7">
              <span className="text-[10px] font-sans tracking-[0.4em] uppercase text-elan-gold font-medium block mb-2">
                BATCH NO. 01 • BHOPAL HARVEST ALLOCATION
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-elan-cream font-medium">
                Reserve Your Pressing
              </h2>
            </div>

            {/* Signature Curated 4-Bottle Discovery Flight */}
            <button
              type="button"
              onClick={() => {
                luxuryAudio.playClick();
                setSelectedOption(COFFRET_OPTION);
                setQuantity(1);
              }}
              className={`w-full mb-4 p-4 rounded-2xl border text-left flex items-center justify-between gap-4 transition-all duration-300 ${
                selectedOption.id === COFFRET_OPTION.id
                  ? 'bg-gradient-to-r from-elan-gold/20 via-elan-gold/10 to-transparent border-elan-gold shadow-[0_0_24px_rgba(200,169,106,0.2)]'
                  : 'bg-white/[0.03] border-white/10 hover:border-elan-gold/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full border border-elan-gold/40 bg-elan-gold/10 flex items-center justify-center text-elan-gold">
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                </span>
                <div>
                  <span className="font-serif text-base text-elan-cream block">
                    {TASTING_COFFRET.name}
                  </span>
                  <span className="text-[11px] font-sans text-elan-cream/65 font-light">
                    {TASTING_COFFRET.volume} • Mango, Guava, Strawberry &amp; Mixed Berry
                  </span>
                </div>
              </div>
              <span className="font-serif text-lg text-elan-gold font-semibold">
                {TASTING_COFFRET.price}
              </span>
            </button>

            {/* Individual Flavour Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
              {FLAVOURS.map((f) => {
                const isSelected = f.id === selectedOption.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      luxuryAudio.playClick();
                      setSelectedOption(f);
                    }}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 ${
                      isSelected
                        ? 'bg-elan-gold/15 border-elan-gold text-elan-cream shadow-[0_0_20px_rgba(200,169,106,0.2)]'
                        : 'bg-white/5 border-white/10 text-elan-cream/70 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />
                      <span className="text-[9px] font-sans text-elan-gold uppercase">{f.price}</span>
                    </div>
                    <span className="font-serif text-xs font-medium block truncate">{f.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 mb-7">
              <div>
                <span className="font-serif text-base text-elan-cream block">
                  {selectedOption.isCoffret
                    ? `Coffret Boxes (${quantity * 4} bottles total)`
                    : `Bottles (${selectedOption.volume})`}
                </span>
                <span className="text-xs text-elan-cream/60 font-light">
                  Pressed at dawn • Chilled insulated cask
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-full border border-white/20 text-elan-cream flex items-center justify-center hover:border-elan-gold"
                >
                  -
                </button>
                <span className="font-serif text-lg text-elan-gold font-semibold w-6 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-full border border-white/20 text-elan-cream flex items-center justify-center hover:border-elan-gold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Reservation Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="order-full-name"
                  className="text-[10px] font-sans tracking-widest text-elan-cream/70 uppercase block mb-1"
                >
                  Full Name
                </label>
                <input
                  id="order-full-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="e.g. Aarav Mehra"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-elan-cream focus:border-elan-gold focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="order-phone"
                    className="text-[10px] font-sans tracking-widest text-elan-cream/70 uppercase block mb-1"
                  >
                    Phone Number
                  </label>
                  <input
                    id="order-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    placeholder="+91 98260 12345"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-elan-cream focus:border-elan-gold focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="order-city"
                    className="text-[10px] font-sans tracking-widest text-elan-cream/70 uppercase block mb-1"
                  >
                    City / Location
                  </label>
                  <input
                    id="order-city"
                    name="city"
                    type="text"
                    autoComplete="address-level2"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-elan-cream focus:border-elan-gold focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="order-address"
                  className="text-[10px] font-sans tracking-widest text-elan-cream/70 uppercase block mb-1"
                >
                  Delivery Address
                </label>
                <textarea
                  id="order-address"
                  name="address"
                  autoComplete="street-address"
                  required
                  rows={2}
                  placeholder="Street address, residence number, area"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-elan-cream focus:border-elan-gold focus:outline-none text-sm"
                />
              </div>

              {errorMsg && <p className="text-xs text-rose-400 font-sans">{errorMsg}</p>}

              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-elan-cream/60 uppercase block">Allocation Total</span>
                  <span className="font-serif text-3xl text-gold-gradient font-bold">₹{totalPrice}</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-4 rounded-full bg-elan-gold text-elan-dark font-serif tracking-[0.2em] text-xs uppercase font-semibold hover:bg-elan-goldLight transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> CONFIRMING ALLOCATION...
                    </>
                  ) : (
                    <>CONFIRM ALLOCATION</>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Gold-Foil Harvest Allocation Certificate */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center py-6 px-2"
          >
            <div className="max-w-md mx-auto rounded-3xl border border-elan-gold/50 bg-gradient-to-b from-elan-gold/10 via-white/[0.02] to-transparent p-7 shadow-[0_0_50px_rgba(200,169,106,0.12)] mb-7">
              <div className="w-16 h-16 rounded-full border border-elan-gold/60 bg-elan-gold/15 flex items-center justify-center mx-auto mb-5 shadow-[0_0_25px_rgba(200,169,106,0.3)]">
                <Award className="w-8 h-8 text-elan-gold" aria-hidden="true" />
              </div>

              <span className="text-[10px] font-sans tracking-[0.35em] uppercase text-elan-gold font-semibold block mb-2">
                HARVEST ALLOCATION SEAL • {confirmedOrder?.id}
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl text-elan-cream mb-3">
                Reserved for {confirmedOrder?.name}
              </h3>
              <p className="font-sans text-xs sm:text-sm text-elan-cream/80 font-light leading-relaxed mb-6">
                {confirmedOrder?.bottles} bottle{confirmedOrder?.bottles === 1 ? '' : 's'} ({confirmedOrder?.flavourName}) • ₹{confirmedOrder?.totalPrice} scheduled for our next dawn cold-pressing in Bhopal.
              </p>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-left text-xs space-y-2.5">
                <div className="flex items-center gap-2.5 text-elan-gold">
                  <MapPin className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span>{confirmedOrder?.address}, {confirmedOrder?.city}</span>
                </div>
                <div className="flex items-center gap-2.5 text-elan-cream/75">
                  <Truck className="w-4 h-4 flex-shrink-0 text-elan-gold/80" aria-hidden="true" />
                  <span>Chilled Insulated Cask • Batch No. 01 Express Dispatch</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                onClose();
              }}
              className="px-8 py-3.5 rounded-full bg-elan-gold text-elan-dark font-serif text-xs tracking-[0.2em] uppercase font-semibold hover:bg-elan-goldLight transition-colors"
            >
              RETURN TO EXPERIENCE
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
