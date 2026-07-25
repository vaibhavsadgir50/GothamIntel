import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, MapPin, Eye, Calendar, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Listing } from '../../types';

export const HostListings: React.FC = () => {
  const { authHeaders } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/host/listings', { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => setListings(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authHeaders]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800">Listings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sublets you have posted.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-2 hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <Link
            to="/host/listings/new"
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Post Sublet
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 animate-pulse">Loading listings...</p>
      ) : listings.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-slate-200 space-y-3">
          <p className="text-sm text-slate-600">No listings yet</p>
          <Link
            to="/host/listings/new"
            className="inline-flex px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold"
          >
            Post your first sublet
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <article
              key={listing.id}
              className="rounded-2xl bg-white border border-slate-200 overflow-hidden"
            >
              <img
                src={listing.imageUrl}
                alt={listing.title}
                className="w-full h-40 object-cover"
              />
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-teal-700 font-bold text-sm">
                    ${listing.pricePerMonth ?? listing.price}/mo
                  </span>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {listing.views ?? 0} views
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 line-clamp-2">{listing.title}</h3>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {listing.neighborhood} · {listing.address}
                </p>
                {(listing.availableFrom || listing.availableTo) && (
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {listing.availableFrom} → {listing.availableTo}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

const AMENITY_OPTIONS = [
  'WiFi',
  'Furnished',
  'In-Unit Washer/Dryer',
  'Dishwasher',
  'Air Conditioning',
  'Doorman',
  'Elevator',
  'Pet Friendly',
  'Gym',
  'Roof Deck',
];

export const PostListingForm: React.FC = () => {
  const { authHeaders } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    address: '',
    neighborhood: '',
    pricePerMonth: '',
    availableFrom: '',
    availableTo: '',
    images: '',
    amenities: [] as string[],
    description: '',
    beds: '1',
    baths: '1',
  });

  const toggleAmenity = (a: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter((x) => x !== a)
        : [...prev.amenities, a],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const images = form.images
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          title: form.title,
          address: form.address,
          neighborhood: form.neighborhood,
          pricePerMonth: Number(form.pricePerMonth),
          availableFrom: form.availableFrom,
          availableTo: form.availableTo,
          images,
          amenities: form.amenities,
          description: form.description,
          beds: Number(form.beds),
          baths: Number(form.baths),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create listing');
      navigate('/host/listings');
    } catch (err: any) {
      setError(err.message || 'Failed to post sublet');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    'w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 placeholder-slate-400';

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-800">Post a Sublet</h1>
        <p className="text-sm text-slate-500 mt-1">
          Create a new listing visible on Discover.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
          <input
            required
            className={fieldClass}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Sunny 1BR near L train"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Address</label>
          <input
            required
            className={fieldClass}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="123 Bedford Ave #4B, Brooklyn, NY"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Neighborhood</label>
            <input
              required
              className={fieldClass}
              value={form.neighborhood}
              onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
              placeholder="Williamsburg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Price / month</label>
            <input
              required
              type="number"
              min={1}
              className={fieldClass}
              value={form.pricePerMonth}
              onChange={(e) => setForm({ ...form, pricePerMonth: e.target.value })}
              placeholder="3200"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Available From</label>
            <input
              required
              type="date"
              className={fieldClass}
              value={form.availableFrom}
              onChange={(e) => setForm({ ...form, availableFrom: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Available To</label>
            <input
              required
              type="date"
              className={fieldClass}
              value={form.availableTo}
              onChange={(e) => setForm({ ...form, availableTo: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Beds</label>
            <input
              type="number"
              min={0}
              className={fieldClass}
              value={form.beds}
              onChange={(e) => setForm({ ...form, beds: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Baths</label>
            <input
              type="number"
              min={1}
              step={0.5}
              className={fieldClass}
              value={form.baths}
              onChange={(e) => setForm({ ...form, baths: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Image URLs (one per line)
          </label>
          <textarea
            rows={3}
            className={fieldClass}
            value={form.images}
            onChange={(e) => setForm({ ...form, images: e.target.value })}
            placeholder="https://images.unsplash.com/..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2">Amenities</label>
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={`px-3 py-1.5 rounded-xl text-[11px] border transition-all ${
                  form.amenities.includes(a)
                    ? 'bg-teal-50 border-teal-300 text-teal-700 font-semibold'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
          <textarea
            rows={4}
            className={fieldClass}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Tell people about the space, vibe, and lease terms..."
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/host/listings')}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold disabled:opacity-50"
          >
            {submitting ? 'Publishing...' : 'Publish Sublet'}
          </button>
        </div>
      </form>
    </div>
  );
};
