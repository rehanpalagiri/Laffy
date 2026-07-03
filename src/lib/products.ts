import { MARKET_PRODUCTS } from "@/data/marketProductCatalog";

// Core Laffy product catalog.
// Laffy house brands are fictional; market products use public product names and approximate attributes.
// Wholesale cost is internal-only and must never be shown to customers.

export type Category =
  | "cleanser"
  | "moisturizer"
  | "sunscreen"
  | "exfoliant"
  | "niacinamide-serum"
  | "vitamin-c-serum"
  | "azelaic-cosmetic"
  | "evening-serum"
  | "spot-care"
  | "barrier-support";

export type SkinFeel = "dry" | "oily" | "combination" | "balanced" | "sensitive-any";
export type Sensitivity = "low" | "medium" | "high";
export type ConcernTag =
  | "hydration"
  | "oil-control"
  | "visible-redness"
  | "uneven-texture"
  | "dark-spot-appearance"
  | "blemish-prone"
  | "sunscreen"
  | "barrier";

export interface Product {
  id: string;
  brand: string;
  name: string;
  category: Category;
  price: number;        // retail USD
  wholesaleCost: number; // internal; never rendered to customer
  size: string;
  highlights: string[];
  ingredientKeys: string[]; // generic cosmetic ingredient keys (lowercase)
  skinFeelFit: SkinFeel[];
  concernTags: ConcernTag[];
  sensitivityFit: Sensitivity[];
  fragranceFree: boolean;
  pregnancySafe: boolean; // conservative cosmetic filter — not medical advice
  inStock: boolean;
  subscriptionEligible: boolean;
  swatch: string; // internal color token for generated routine visuals
  imageUrl?: string;
  imageAlt?: string;
  productType?: string;
  usageWindow?: "Morning" | "Night" | "Both";
  frequency?: string;
  nonComedogenic?: boolean;
  warnings?: string[];
  sourceUrl?: string;
  brandSegment?: "drugstore" | "derm" | "k-beauty" | "j-beauty" | "luxury" | "clinical" | "indie";
}

const P = (p: Product) => p;

export const PRODUCTS: Product[] = [
  // --- Cleansers ---
  P({ id: "cl-01", brand: "Aera", name: "Quiet Gel Cleanser", category: "cleanser",
    price: 18, wholesaleCost: 5.2, size: "150ml",
    highlights: ["Low-foam", "pH-balanced", "Removes surface oil gently"],
    ingredientKeys: ["glycerin", "panthenol", "mild-surfactant"],
    skinFeelFit: ["oily", "combination", "balanced"], concernTags: ["oil-control", "blemish-prone"],
    sensitivityFit: ["low", "medium"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-primary-soft to-accent" }),
  P({ id: "cl-02", brand: "Folde", name: "Cream Milk Cleanser", category: "cleanser",
    price: 22, wholesaleCost: 6.4, size: "150ml",
    highlights: ["Cushiony cream", "Leaves skin soft", "Fragrance-free"],
    ingredientKeys: ["glycerin", "squalane", "ceramide-complex"],
    skinFeelFit: ["dry", "balanced", "sensitive-any"], concernTags: ["hydration", "barrier", "visible-redness"],
    sensitivityFit: ["low", "medium", "high"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-secondary-soft to-muted" }),
  P({ id: "cl-03", brand: "Mirin", name: "Calm Micellar Rinse", category: "cleanser",
    price: 16, wholesaleCost: 4.5, size: "200ml",
    highlights: ["No-rinse option", "Very gentle", "Travel-friendly"],
    ingredientKeys: ["glycerin", "panthenol", "mild-surfactant"],
    skinFeelFit: ["sensitive-any", "dry", "balanced"], concernTags: ["visible-redness", "barrier"],
    sensitivityFit: ["medium", "high"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-accent to-primary-soft" }),
  P({ id: "cl-04", brand: "Noor", name: "Everyday Soft Cleanser", category: "cleanser",
    price: 12, wholesaleCost: 3.8, size: "120ml",
    highlights: ["Budget-friendly", "Gentle gel", "Simple daily cleanse"],
    ingredientKeys: ["glycerin", "panthenol", "mild-surfactant"],
    skinFeelFit: ["oily", "combination", "balanced", "dry"], concernTags: ["hydration", "oil-control"],
    sensitivityFit: ["low", "medium"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-primary-soft to-muted" }),

  // --- Moisturizers ---
  P({ id: "mo-01", brand: "Aera", name: "Weightless Daily Gel", category: "moisturizer",
    price: 26, wholesaleCost: 7.1, size: "50ml",
    highlights: ["Oil-free", "Fast-absorbing", "Comfortable under SPF"],
    ingredientKeys: ["hyaluronic-acid", "niacinamide", "glycerin"],
    skinFeelFit: ["oily", "combination"], concernTags: ["hydration", "oil-control"],
    sensitivityFit: ["low", "medium"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-primary-soft to-secondary-soft" }),
  P({ id: "mo-02", brand: "Folde", name: "Rich Replenish Cream", category: "moisturizer",
    price: 34, wholesaleCost: 9.4, size: "50ml",
    highlights: ["Cushioned barrier feel", "Overnight comfort", "Ceramide-forward"],
    ingredientKeys: ["ceramide-complex", "squalane", "shea-butter", "panthenol"],
    skinFeelFit: ["dry", "sensitive-any"], concernTags: ["hydration", "barrier", "visible-redness"],
    sensitivityFit: ["low", "medium", "high"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-secondary-soft to-accent" }),
  P({ id: "mo-03", brand: "Noor", name: "Balanced Daily Lotion", category: "moisturizer",
    price: 24, wholesaleCost: 6.8, size: "75ml",
    highlights: ["All-day hydration", "Neutral finish", "Pairs with most actives"],
    ingredientKeys: ["glycerin", "squalane", "panthenol"],
    skinFeelFit: ["balanced", "combination"], concernTags: ["hydration", "barrier"],
    sensitivityFit: ["low", "medium"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-muted to-primary-soft" }),
  P({ id: "mo-05", brand: "Aera", name: "Simple Barrier Lotion", category: "moisturizer",
    price: 16, wholesaleCost: 4.9, size: "60ml",
    highlights: ["Light barrier support", "Low-cost hydration", "Pairs with SPF"],
    ingredientKeys: ["glycerin", "panthenol", "ceramide-complex"],
    skinFeelFit: ["dry", "balanced", "combination", "sensitive-any"], concernTags: ["hydration", "barrier"],
    sensitivityFit: ["low", "medium", "high"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-secondary-soft to-primary-soft" }),

  // --- Sunscreens ---
  P({ id: "sp-01", brand: "Mirin", name: "Featherlight Daily SPF 50", category: "sunscreen",
    price: 28, wholesaleCost: 7.6, size: "50ml",
    highlights: ["Invisible finish", "Broad-spectrum SPF 50", "Reef-considerate filters"],
    ingredientKeys: ["spf-organic-filters", "glycerin"],
    skinFeelFit: ["oily", "combination", "balanced"], concernTags: ["sunscreen", "dark-spot-appearance"],
    sensitivityFit: ["low", "medium"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-secondary to-secondary-soft" }),
  P({ id: "sp-02", brand: "Aera", name: "Mineral Shield SPF 40", category: "sunscreen",
    price: 30, wholesaleCost: 8.1, size: "50ml",
    highlights: ["100% mineral filters", "Tinted neutral", "Pregnancy-friendly cosmetic option"],
    ingredientKeys: ["zinc-oxide", "iron-oxides", "glycerin"],
    skinFeelFit: ["dry", "balanced", "sensitive-any"], concernTags: ["sunscreen", "visible-redness"],
    sensitivityFit: ["medium", "high"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-secondary-soft to-muted" }),
  P({ id: "sp-04", brand: "Noor", name: "Daily Light SPF 30", category: "sunscreen",
    price: 16, wholesaleCost: 4.7, size: "45ml",
    highlights: ["Budget-friendly SPF", "Soft natural finish", "Daily wear"],
    ingredientKeys: ["spf-organic-filters", "glycerin"],
    skinFeelFit: ["oily", "combination", "balanced"], concernTags: ["sunscreen", "dark-spot-appearance"],
    sensitivityFit: ["low", "medium"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-accent to-secondary-soft" }),

  // --- Gentle exfoliants ---
  P({ id: "ex-01", brand: "Noor", name: "Soft PHA Toner", category: "exfoliant",
    price: 24, wholesaleCost: 6.4, size: "100ml",
    highlights: ["Gentle gluconolactone", "Smoother-looking texture", "2–3x weekly"],
    ingredientKeys: ["pha-gluconolactone", "glycerin", "panthenol"],
    skinFeelFit: ["combination", "balanced", "oily"], concernTags: ["uneven-texture", "dark-spot-appearance"],
    sensitivityFit: ["medium"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: false,
    swatch: "bg-gradient-to-br from-accent to-secondary-soft" }),
  P({ id: "ex-02", brand: "Folde", name: "Polish Mandelic Essence", category: "exfoliant",
    price: 32, wholesaleCost: 8.6, size: "100ml",
    highlights: ["Slow-release mandelic", "Brighter-looking finish", "Lower-irritation option"],
    ingredientKeys: ["mandelic-acid", "panthenol", "glycerin"],
    skinFeelFit: ["combination", "oily", "balanced"], concernTags: ["uneven-texture", "blemish-prone", "dark-spot-appearance"],
    sensitivityFit: ["low", "medium"], fragranceFree: true, pregnancySafe: false, inStock: true, subscriptionEligible: false,
    swatch: "bg-gradient-to-br from-secondary to-primary-soft" }),

  // --- Niacinamide-style serums ---
  P({ id: "ni-01", brand: "Aera", name: "Even Niacinamide 5%", category: "niacinamide-serum",
    price: 22, wholesaleCost: 5.9, size: "30ml",
    highlights: ["Helps minimize the look of pores", "Comfortable daily use", "Layer-friendly"],
    ingredientKeys: ["niacinamide", "zinc-pca", "glycerin"],
    skinFeelFit: ["oily", "combination", "balanced"], concernTags: ["oil-control", "uneven-texture", "blemish-prone"],
    sensitivityFit: ["low", "medium"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-primary-soft to-muted" }),
  P({ id: "ni-02", brand: "Mirin", name: "Calm Niacinamide + Panthenol", category: "niacinamide-serum",
    price: 26, wholesaleCost: 7.0, size: "30ml",
    highlights: ["Supports a calmer appearance", "Lower-percentage formula", "Sensitive-skin friendly"],
    ingredientKeys: ["niacinamide", "panthenol", "centella-extract"],
    skinFeelFit: ["sensitive-any", "dry", "balanced"], concernTags: ["visible-redness", "barrier", "uneven-texture"],
    sensitivityFit: ["medium", "high"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-accent to-primary-soft" }),

  // --- Vitamin-C-style serums ---
  P({ id: "vc-01", brand: "Noor", name: "Glow Ascorbyl Glucoside 10%", category: "vitamin-c-serum",
    price: 38, wholesaleCost: 10.2, size: "30ml",
    highlights: ["Stable vitamin-C derivative", "Brighter-looking finish", "Morning routine"],
    ingredientKeys: ["vitamin-c-derivative", "ferulic-acid", "glycerin"],
    skinFeelFit: ["balanced", "combination", "oily"], concernTags: ["dark-spot-appearance", "uneven-texture"],
    sensitivityFit: ["low", "medium"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-secondary to-accent" }),
  P({ id: "vc-02", brand: "Folde", name: "Gentle THD Vitamin-C", category: "vitamin-c-serum",
    price: 46, wholesaleCost: 12.4, size: "30ml",
    highlights: ["Oil-soluble derivative", "Comfortable for drier skin", "Low-tingle"],
    ingredientKeys: ["vitamin-c-derivative", "squalane", "vitamin-e"],
    skinFeelFit: ["dry", "balanced", "sensitive-any"], concernTags: ["dark-spot-appearance", "barrier"],
    sensitivityFit: ["medium", "high"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: false,
    swatch: "bg-gradient-to-br from-secondary-soft to-secondary" }),

  // --- Azelaic-acid-style cosmetic ---
  P({ id: "az-01", brand: "Aera", name: "Smooth Azelaic 10% Cream", category: "azelaic-cosmetic",
    price: 30, wholesaleCost: 8.2, size: "30ml",
    highlights: ["Helps with the look of uneven tone", "Comfortable cream texture", "Daily"],
    ingredientKeys: ["azelaic-acid", "glycerin", "squalane"],
    skinFeelFit: ["combination", "balanced", "sensitive-any"], concernTags: ["visible-redness", "dark-spot-appearance", "blemish-prone"],
    sensitivityFit: ["low", "medium", "high"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-primary-soft to-secondary" }),

  // --- Evening serum (retinoid-free) ---
  P({ id: "ev-01", brand: "Mirin", name: "Bakuchiol Night Concentrate", category: "evening-serum",
    price: 42, wholesaleCost: 11.4, size: "30ml",
    highlights: ["Retinoid-free", "Smoother-looking texture overnight", "Pregnancy-friendly cosmetic option"],
    ingredientKeys: ["bakuchiol", "squalane", "vitamin-e"],
    skinFeelFit: ["dry", "balanced", "combination", "sensitive-any"], concernTags: ["uneven-texture", "dark-spot-appearance"],
    sensitivityFit: ["low", "medium", "high"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-accent to-secondary-soft" }),
  P({ id: "ev-02", brand: "Folde", name: "Peptide Night Serum", category: "evening-serum",
    price: 48, wholesaleCost: 12.9, size: "30ml",
    highlights: ["Multi-peptide blend", "Supports a firmer-looking feel", "Pairs with moisturizer"],
    ingredientKeys: ["peptide-complex", "hyaluronic-acid", "panthenol"],
    skinFeelFit: ["balanced", "dry", "combination"], concernTags: ["uneven-texture", "barrier"],
    sensitivityFit: ["low", "medium"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-secondary-soft to-primary-soft" }),

  // --- Spot care ---
  P({ id: "sc-01", brand: "Noor", name: "Targeted Spot Dots", category: "spot-care",
    price: 14, wholesaleCost: 3.4, size: "36 patches",
    highlights: ["Hydrocolloid patches", "Overnight wear", "Helps reduce picking"],
    ingredientKeys: ["hydrocolloid"],
    skinFeelFit: ["oily", "combination", "balanced", "dry"], concernTags: ["blemish-prone"],
    sensitivityFit: ["low", "medium", "high"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-muted to-accent" }),
  P({ id: "sc-02", brand: "Aera", name: "Salicylic Clarity Spot Gel", category: "spot-care",
    price: 18, wholesaleCost: 4.6, size: "15ml",
    highlights: ["2% salicylic acid", "Use sparingly on visible blemishes", "Quick-dry"],
    ingredientKeys: ["salicylic-acid", "niacinamide"],
    skinFeelFit: ["oily", "combination"], concernTags: ["blemish-prone", "oil-control"],
    sensitivityFit: ["low", "medium"], fragranceFree: true, pregnancySafe: false, inStock: true, subscriptionEligible: false,
    swatch: "bg-gradient-to-br from-primary-soft to-accent" }),

  // --- Barrier support ---
  P({ id: "ba-01", brand: "Folde", name: "Ceramide Barrier Mist", category: "barrier-support",
    price: 28, wholesaleCost: 7.4, size: "100ml",
    highlights: ["Comforting fine mist", "Layer before moisturizer", "Reduces tight feel"],
    ingredientKeys: ["ceramide-complex", "panthenol", "glycerin"],
    skinFeelFit: ["dry", "sensitive-any", "balanced"], concernTags: ["barrier", "hydration", "visible-redness"],
    sensitivityFit: ["medium", "high"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-secondary-soft to-muted" }),
  P({ id: "ba-02", brand: "Mirin", name: "Overnight Repair Balm", category: "barrier-support",
    price: 34, wholesaleCost: 9.1, size: "30ml",
    highlights: ["Occlusive overnight finish", "Helps reduce overnight moisture loss", "Use as sleeping mask"],
    ingredientKeys: ["squalane", "shea-butter", "ceramide-complex"],
    skinFeelFit: ["dry", "sensitive-any"], concernTags: ["barrier", "hydration"],
    sensitivityFit: ["low", "medium", "high"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-accent to-secondary-soft" }),

  // --- Extras to round out 24 ---
  P({ id: "ni-03", brand: "Noor", name: "Pore-Look Niacinamide 10%", category: "niacinamide-serum",
    price: 24, wholesaleCost: 6.2, size: "30ml",
    highlights: ["Higher-percentage niacinamide", "For visible oil control", "Layer-friendly"],
    ingredientKeys: ["niacinamide", "zinc-pca"],
    skinFeelFit: ["oily", "combination"], concernTags: ["oil-control", "blemish-prone"],
    sensitivityFit: ["low"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-primary-soft to-muted" }),
  P({ id: "mo-04", brand: "Mirin", name: "Sensitive Calm Cream", category: "moisturizer",
    price: 30, wholesaleCost: 8.0, size: "50ml",
    highlights: ["Designed for reactive-feeling skin", "Centella + panthenol", "Fragrance-free"],
    ingredientKeys: ["centella-extract", "panthenol", "ceramide-complex", "glycerin"],
    skinFeelFit: ["sensitive-any", "dry", "balanced"], concernTags: ["visible-redness", "barrier"],
    sensitivityFit: ["medium", "high"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-accent to-primary-soft" }),
  P({ id: "sp-03", brand: "Folde", name: "Hydrating Daily SPF 30", category: "sunscreen",
    price: 24, wholesaleCost: 6.3, size: "50ml",
    highlights: ["Lower SPF, drier-skin friendly finish", "Cushiony texture", "Daily wear"],
    ingredientKeys: ["spf-organic-filters", "glycerin", "squalane"],
    skinFeelFit: ["dry", "balanced"], concernTags: ["sunscreen", "hydration"],
    sensitivityFit: ["low", "medium"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-secondary-soft to-secondary" }),
  P({ id: "az-02", brand: "Noor", name: "Daily Azelaic Gel", category: "azelaic-cosmetic",
    price: 28, wholesaleCost: 7.2, size: "30ml",
    highlights: ["Lighter gel texture", "Comfortable for combination skin", "Helps even-looking tone"],
    ingredientKeys: ["azelaic-acid", "niacinamide", "glycerin"],
    skinFeelFit: ["combination", "oily", "balanced"], concernTags: ["visible-redness", "dark-spot-appearance", "blemish-prone"],
    sensitivityFit: ["low", "medium"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-primary-soft to-secondary-soft" }),

  // --- Expanded assortment for more varied personalized boxes ---
  P({ id: "cl-05", brand: "Solenne", name: "Cloud Foam Cleanser", category: "cleanser",
    price: 20, wholesaleCost: 5.8, size: "150ml",
    highlights: ["Soft foam", "Balanced finish", "Good second cleanse"],
    ingredientKeys: ["glycerin", "amino-acid-surfactant", "panthenol"],
    skinFeelFit: ["balanced", "combination", "oily"], concernTags: ["oil-control", "uneven-texture"],
    sensitivityFit: ["low", "medium"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-accent to-muted" }),
  P({ id: "cl-06", brand: "Ciela", name: "Oil-to-Milk Cleanse", category: "cleanser",
    price: 28, wholesaleCost: 8.0, size: "120ml",
    highlights: ["Melts SPF", "Non-stripping", "Cushiony rinse"],
    ingredientKeys: ["squalane", "sunflower-oil", "glycerin"],
    skinFeelFit: ["dry", "balanced", "sensitive-any"], concernTags: ["hydration", "barrier", "sunscreen"],
    sensitivityFit: ["low", "medium", "high"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-secondary-soft to-card" }),
  P({ id: "cl-07", brand: "Veyra", name: "Fresh Start Gel Wash", category: "cleanser",
    price: 15, wholesaleCost: 4.2, size: "150ml",
    highlights: ["Light gel", "Easy morning cleanse", "Budget-friendly"],
    ingredientKeys: ["glycerin", "mild-surfactant", "green-tea-extract"],
    skinFeelFit: ["oily", "combination", "balanced"], concernTags: ["oil-control", "blemish-prone"],
    sensitivityFit: ["low", "medium"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-primary-soft to-accent" }),

  P({ id: "mo-06", brand: "Veyra", name: "Water Veil Cream", category: "moisturizer",
    price: 28, wholesaleCost: 7.4, size: "50ml",
    highlights: ["Gel-cream", "Weightless hydration", "Soft matte finish"],
    ingredientKeys: ["hyaluronic-acid", "glycerin", "green-tea-extract"],
    skinFeelFit: ["oily", "combination", "balanced"], concernTags: ["hydration", "oil-control"],
    sensitivityFit: ["low", "medium"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-primary-soft to-muted" }),
  P({ id: "mo-07", brand: "Ilari", name: "Recovery Gel-Cream", category: "moisturizer",
    price: 36, wholesaleCost: 9.8, size: "50ml",
    highlights: ["Centella-forward", "Calming finish", "Barrier support"],
    ingredientKeys: ["centella-extract", "panthenol", "ceramide-complex"],
    skinFeelFit: ["sensitive-any", "dry", "balanced"], concernTags: ["visible-redness", "barrier", "hydration"],
    sensitivityFit: ["medium", "high"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-accent to-secondary-soft" }),
  P({ id: "mo-08", brand: "Korae", name: "Dew Cushion Moisturizer", category: "moisturizer",
    price: 40, wholesaleCost: 11.1, size: "50ml",
    highlights: ["Plush cream", "Long-wear comfort", "Glow without heaviness"],
    ingredientKeys: ["squalane", "hyaluronic-acid", "ceramide-complex"],
    skinFeelFit: ["dry", "balanced", "combination"], concernTags: ["hydration", "barrier", "dark-spot-appearance"],
    sensitivityFit: ["low", "medium"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-secondary-soft to-secondary" }),

  P({ id: "sp-05", brand: "Veyra", name: "Silk Screen SPF 45", category: "sunscreen",
    price: 34, wholesaleCost: 9.0, size: "50ml",
    highlights: ["Soft-blur finish", "No white cast", "Comfortable under makeup"],
    ingredientKeys: ["spf-organic-filters", "niacinamide", "glycerin"],
    skinFeelFit: ["oily", "combination", "balanced"], concernTags: ["sunscreen", "oil-control", "dark-spot-appearance"],
    sensitivityFit: ["low", "medium"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-accent to-primary-soft" }),
  P({ id: "sp-06", brand: "Ciela", name: "Mineral Veil SPF 50", category: "sunscreen",
    price: 42, wholesaleCost: 11.4, size: "50ml",
    highlights: ["Mineral filters", "Flexible tint", "Comfort for reactive-feeling skin"],
    ingredientKeys: ["zinc-oxide", "iron-oxides", "squalane"],
    skinFeelFit: ["dry", "balanced", "sensitive-any"], concernTags: ["sunscreen", "visible-redness", "barrier"],
    sensitivityFit: ["medium", "high"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-secondary-soft to-muted" }),

  P({ id: "ex-03", brand: "Lumae", name: "Enzyme PHA Polish", category: "exfoliant",
    price: 30, wholesaleCost: 8.2, size: "75ml",
    highlights: ["Creamy rinse-off polish", "Gentle weekly reset", "Good for dull-looking texture"],
    ingredientKeys: ["pha-gluconolactone", "enzyme-complex", "glycerin"],
    skinFeelFit: ["dry", "balanced", "combination"], concernTags: ["uneven-texture", "dark-spot-appearance"],
    sensitivityFit: ["medium", "high"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: false,
    swatch: "bg-gradient-to-br from-secondary-soft to-accent" }),
  P({ id: "ex-04", brand: "Ilari", name: "Soft Lactic Resurfacer", category: "exfoliant",
    price: 36, wholesaleCost: 9.9, size: "100ml",
    highlights: ["Low-dose lactic acid", "Smooth-looking finish", "Hydrating feel"],
    ingredientKeys: ["aha", "hyaluronic-acid", "panthenol"],
    skinFeelFit: ["dry", "balanced", "combination"], concernTags: ["uneven-texture", "dark-spot-appearance", "hydration"],
    sensitivityFit: ["low", "medium"], fragranceFree: true, pregnancySafe: false, inStock: true, subscriptionEligible: false,
    swatch: "bg-gradient-to-br from-secondary to-card" }),

  P({ id: "ni-04", brand: "Solenne", name: "Pore Balance Serum", category: "niacinamide-serum",
    price: 30, wholesaleCost: 8.0, size: "30ml",
    highlights: ["Niacinamide + zinc", "Shine-aware", "Daily-light texture"],
    ingredientKeys: ["niacinamide", "zinc-pca", "green-tea-extract"],
    skinFeelFit: ["oily", "combination"], concernTags: ["oil-control", "blemish-prone", "uneven-texture"],
    sensitivityFit: ["low", "medium"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-primary-soft to-secondary-soft" }),
  P({ id: "ni-05", brand: "Ciela", name: "Barrier Niacinamide 3%", category: "niacinamide-serum",
    price: 32, wholesaleCost: 8.7, size: "30ml",
    highlights: ["Lower-strength niacinamide", "Soothing support", "Designed for easily stressed skin"],
    ingredientKeys: ["niacinamide", "panthenol", "ceramide-complex"],
    skinFeelFit: ["sensitive-any", "dry", "balanced"], concernTags: ["visible-redness", "barrier", "hydration"],
    sensitivityFit: ["medium", "high"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-accent to-muted" }),

  P({ id: "vc-03", brand: "Veyra", name: "C Bright Water Serum", category: "vitamin-c-serum",
    price: 44, wholesaleCost: 11.8, size: "30ml",
    highlights: ["Watery antioxidant serum", "Brighter-looking tone", "Layers easily"],
    ingredientKeys: ["vitamin-c-derivative", "ferulic-acid", "hyaluronic-acid"],
    skinFeelFit: ["oily", "combination", "balanced"], concernTags: ["dark-spot-appearance", "uneven-texture", "sunscreen"],
    sensitivityFit: ["low", "medium"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-secondary to-primary-soft" }),
  P({ id: "vc-04", brand: "Ilari", name: "Daylight Antioxidant Milk", category: "vitamin-c-serum",
    price: 52, wholesaleCost: 14.1, size: "30ml",
    highlights: ["Milky serum", "Gentler glow support", "Comfortable for dry skin"],
    ingredientKeys: ["vitamin-c-derivative", "squalane", "vitamin-e"],
    skinFeelFit: ["dry", "balanced", "sensitive-any"], concernTags: ["dark-spot-appearance", "barrier", "hydration"],
    sensitivityFit: ["medium", "high"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: false,
    swatch: "bg-gradient-to-br from-secondary-soft to-accent" }),

  P({ id: "az-03", brand: "Solenne", name: "Tone Relief Gel-Cream", category: "azelaic-cosmetic",
    price: 34, wholesaleCost: 9.1, size: "30ml",
    highlights: ["Azelaic-style cosmetic", "Redness-aware", "Soft gel-cream"],
    ingredientKeys: ["azelaic-acid", "panthenol", "glycerin"],
    skinFeelFit: ["balanced", "combination", "sensitive-any"], concernTags: ["visible-redness", "blemish-prone", "dark-spot-appearance"],
    sensitivityFit: ["medium", "high"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-primary-soft to-secondary" }),

  P({ id: "ev-03", brand: "Korae", name: "Peptide Sleep Milk", category: "evening-serum",
    price: 54, wholesaleCost: 14.7, size: "30ml",
    highlights: ["Creamy peptide serum", "Barrier-friendly", "Smooth-looking morning finish"],
    ingredientKeys: ["peptide-complex", "ceramide-complex", "hyaluronic-acid"],
    skinFeelFit: ["dry", "balanced", "sensitive-any"], concernTags: ["uneven-texture", "barrier", "hydration"],
    sensitivityFit: ["medium", "high"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-secondary-soft to-muted" }),
  P({ id: "ev-04", brand: "Veyra", name: "Smooth Night Jelly", category: "evening-serum",
    price: 38, wholesaleCost: 10.4, size: "30ml",
    highlights: ["Lightweight night serum", "Bakuchiol alternative", "Texture-focused"],
    ingredientKeys: ["bakuchiol", "glycerin", "green-tea-extract"],
    skinFeelFit: ["oily", "combination", "balanced"], concernTags: ["uneven-texture", "blemish-prone"],
    sensitivityFit: ["low", "medium"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-primary-soft to-accent" }),

  P({ id: "sc-03", brand: "Ciela", name: "Blemish Cushion Patches", category: "spot-care",
    price: 16, wholesaleCost: 4.0, size: "42 patches",
    highlights: ["Thin hydrocolloid", "Day or night wear", "Helps discourage picking"],
    ingredientKeys: ["hydrocolloid", "centella-extract"],
    skinFeelFit: ["oily", "combination", "balanced", "dry", "sensitive-any"], concernTags: ["blemish-prone", "visible-redness"],
    sensitivityFit: ["low", "medium", "high"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-muted to-primary-soft" }),

  P({ id: "ba-03", brand: "Ilari", name: "Lipid Recovery Serum", category: "barrier-support",
    price: 46, wholesaleCost: 12.0, size: "30ml",
    highlights: ["Ceramide serum", "Comfort-first", "Good after active use"],
    ingredientKeys: ["ceramide-complex", "squalane", "panthenol"],
    skinFeelFit: ["dry", "sensitive-any", "balanced"], concernTags: ["barrier", "hydration", "visible-redness"],
    sensitivityFit: ["medium", "high"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-secondary-soft to-accent" }),
  P({ id: "ba-04", brand: "Solenne", name: "Redness Comfort Drops", category: "barrier-support",
    price: 34, wholesaleCost: 8.9, size: "30ml",
    highlights: ["Panthenol-rich drops", "Calm-looking finish", "Layers under cream"],
    ingredientKeys: ["panthenol", "centella-extract", "glycerin"],
    skinFeelFit: ["sensitive-any", "dry", "balanced", "combination"], concernTags: ["visible-redness", "barrier", "hydration"],
    sensitivityFit: ["medium", "high"], fragranceFree: true, pregnancySafe: true, inStock: true, subscriptionEligible: true,
    swatch: "bg-gradient-to-br from-accent to-primary-soft" }),
  ...MARKET_PRODUCTS,
];

export const byId = (id: string) => PRODUCTS.find((p) => p.id === id);
export const byCategory = (c: Category) => PRODUCTS.filter((p) => p.category === c);
